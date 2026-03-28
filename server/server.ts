import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { Hocuspocus } from '@hocuspocus/server';
import { WebSocketServer } from 'ws';

const host = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '1234');
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// ---------------------------------------------------------------------------
// Hocuspocus Configuration
// ---------------------------------------------------------------------------
const hocuspocus = new Hocuspocus({
  name: 'pdf-scrawl-hocuspocus',
  async onAuthenticate({ token }) {
    if (AUTH_TOKEN && token !== AUTH_TOKEN) {
      throw new Error('Unauthorized');
    }
  },
});

// ---------------------------------------------------------------------------
// PDF file storage — temp dir, keyed by room ID.
// ---------------------------------------------------------------------------
const PDF_DIR = join(tmpdir(), 'pdf-rooms');
mkdir(PDF_DIR, { recursive: true }).catch(() => {});

const ROOM_ID_RE = /^[a-z0-9]{8,32}$/;
const MAX_BODY = 50 * 1024 * 1024; // 50 MB

function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function handlePdfUpload(roomId: string, req: IncomingMessage, res: ServerResponse) {
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

const server = createServer((req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const isPdfRoute = parts.length === 3 && parts[0] === 'room' && parts[2] === 'pdf';
  const roomId = isPdfRoute ? parts[1] : null;

  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hocuspocus server ok');
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
// Hocuspocus WebSocket Upgrade handler
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    hocuspocus.handleConnection(ws, request);
  });
});

server.listen(port, host, () => {
  console.log(`Hocuspocus server listening on ws://${host}:${port}`);
  if (AUTH_TOKEN) {
    console.log('Auth enabled — clients must supply ?token=<AUTH_TOKEN>');
  } else {
    console.log('Auth disabled (set AUTH_TOKEN env var to enable)');
  }
});
