import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { URL } from 'url';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdir, writeFile, readFile } from 'fs/promises';

// y-websocket v2 ships bin/utils as an undocumented CommonJS entry point.
// Pin this behaviour with a runtime check so a future upgrade doesn't silently
// break the server.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ywsUtils = require('y-websocket/bin/utils');
const setupWSConnection: (
  ws: WebSocket,
  req: IncomingMessage,
  opts: { docName: string; gc: boolean }
) => void = ywsUtils.setupWSConnection;

if (typeof setupWSConnection !== 'function') {
  throw new Error(
    'y-websocket/bin/utils did not export setupWSConnection — check the installed version of y-websocket'
  );
}

const host = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '1234');

// ---------------------------------------------------------------------------
// PDF file storage — temp dir, keyed by room ID.
// No persistence between server restarts; fine for dev/demo.
// ---------------------------------------------------------------------------
const PDF_DIR = join(tmpdir(), 'pdf-rooms');
// Ensure directory exists at startup (non-blocking; errors caught below)
mkdir(PDF_DIR, { recursive: true }).catch(() => {});

const ROOM_ID_RE = /^[a-z0-9]{8,32}$/;
const MAX_BODY = 50 * 1024 * 1024; // 50 MB

function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function handlePdfUpload(roomId: string, req: IncomingMessage, res: ServerResponse) {
  // Collect body
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) {
      res.writeHead(413);
      res.end('Payload too large');
      req.destroy();
      return;
    }
    chunks.push(chunk as Buffer);
  }
  const body = Buffer.concat(chunks);
  // Basic PDF magic-bytes check
  if (body.length < 4 || body.slice(0, 4).toString() !== '%PDF') {
    res.writeHead(400);
    res.end('Not a PDF');
    return;
  }
  try {
    await writeFile(join(PDF_DIR, `${roomId}.pdf`), body);
    res.writeHead(204);
    res.end();
  } catch {
    res.writeHead(500);
    res.end('Storage error');
  }
}

async function handlePdfDownload(roomId: string, res: ServerResponse) {
  try {
    const data = await readFile(join(PDF_DIR, `${roomId}.pdf`));
    res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Length': data.length });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

// ---------------------------------------------------------------------------
// Optional bearer-token auth. Set the AUTH_TOKEN env var to enable.
// Clients must send ?token=<value> in the WebSocket URL.
// If AUTH_TOKEN is not set the check is skipped (dev/demo mode).
// ---------------------------------------------------------------------------
const AUTH_TOKEN = process.env.AUTH_TOKEN;

function isAuthorised(req: IncomingMessage): boolean {
  if (!AUTH_TOKEN) return true; // auth disabled
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    return url.searchParams.get('token') === AUTH_TOKEN;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Derive a room name from the URL path so different documents are isolated.
// e.g. ws://localhost:1234/room/my-doc  →  docName "my-doc"
// Falls back to "default" for the root path.
// ---------------------------------------------------------------------------
function getRoomName(req: IncomingMessage): string {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const parts = url.pathname.split('/').filter(Boolean);
    // Expect path  /room/<name>
    if (parts[0] === 'room' && parts[1]) {
      return decodeURIComponent(parts[1]);
    }
  } catch {
    // fall through
  }
  return 'default';
}

// ---------------------------------------------------------------------------
// HTTP server — health-check + PDF upload/download. WebSocket upgrades bypass.
// ---------------------------------------------------------------------------
const server = createServer((req, res) => {
  setCorsHeaders(res);

  // Pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  // /room/<roomId>/pdf
  const isPdfRoute = parts.length === 3 && parts[0] === 'room' && parts[2] === 'pdf';
  const roomId = isPdfRoute ? parts[1] : null;

  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('y-websocket server ok');
    return;
  }

  if (isPdfRoute && roomId && ROOM_ID_RE.test(roomId)) {
    if (req.method === 'POST') {
      handlePdfUpload(roomId, req, res).catch(() => { res.writeHead(500); res.end(); });
      return;
    }
    if (req.method === 'GET') {
      handlePdfDownload(roomId, res).catch(() => { res.writeHead(500); res.end(); });
      return;
    }
  }

  res.writeHead(404);
  res.end();
});

// ---------------------------------------------------------------------------
// WebSocket server
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  if (!isAuthorised(req)) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  const docName = getRoomName(req);
  setupWSConnection(ws, req, { docName, gc: true });
});

server.listen(port, host, () => {
  console.log(`y-websocket server listening on ws://${host}:${port}`);
  if (AUTH_TOKEN) {
    console.log('Auth enabled — clients must supply ?token=<AUTH_TOKEN>');
  } else {
    console.log('Auth disabled (set AUTH_TOKEN env var to enable)');
  }
});
