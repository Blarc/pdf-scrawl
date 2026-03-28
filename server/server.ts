import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { join, extname } from 'path';
import { tmpdir } from 'os';
import { mkdir, writeFile, readFile, stat } from 'fs/promises';
import { Hocuspocus } from '@hocuspocus/server';
import { WebSocketServer } from 'ws';

const host = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '1234');
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Path to the frontend build artifacts
// Using process.cwd() because __dirname is not available in ES modules
const FRONTEND_DIST = join(process.cwd(), '../frontend/dist');

// ---------------------------------------------------------------------------
// Hocuspocus Configuration
// ---------------------------------------------------------------------------
const hocuspocus = new Hocuspocus({
  name: 'pdf-scrawl-hocuspocus',
  async onAuthenticate({ token, documentName }) {
    console.log(`Authenticating connection for document: ${documentName}`);
    if (AUTH_TOKEN && token !== AUTH_TOKEN) {
      throw new Error('Unauthorized');
    }
  },
  async onConnect({ documentName }) {
    console.log(`New connection to document: ${documentName}`);
  },
  async onLoadDocument({ documentName, document }) {
    console.log(`Loading document: ${documentName}`);
    // Here you could load the document from a database if it exists
    // For now, it's in-memory, so Hocuspocus handles it.
  }
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

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
};

async function serveStaticFile(filePath: string, res: ServerResponse) {
  try {
    const data = await readFile(filePath);
    const contentType = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
    return true;
  } catch {
    return false;
  }
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

const server = createServer(async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const pathname = url.pathname;
  const parts = pathname.split('/').filter(Boolean);
  
  // PDF Routes
  const isPdfRoute = parts.length === 3 && parts[0] === 'room' && parts[2] === 'pdf';
  const roomId = isPdfRoute ? parts[1] : null;

  if (isPdfRoute && roomId && ROOM_ID_RE.test(roomId)) {
    if (req.method === 'POST') {
      await handlePdfUpload(roomId, req, res).catch(() => { res.writeHead(500); res.end(); });
      return;
    }
    if (req.method === 'GET') {
      await handlePdfDownload(roomId, res).catch(() => { res.writeHead(500); res.end(); });
      return;
    }
  }

  // Health check
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  // Static files (Frontend)
  let staticFilePath = join(FRONTEND_DIST, pathname === '/' ? 'index.html' : pathname);
  
  // SPA fallback: if file doesn't exist, serve index.html
  try {
    await stat(staticFilePath);
  } catch {
    staticFilePath = join(FRONTEND_DIST, 'index.html');
  }

  const served = await serveStaticFile(staticFilePath, res);
  if (!served) {
    res.writeHead(404);
    res.end('Not found');
  }
});

// ---------------------------------------------------------------------------
// Hocuspocus WebSocket Upgrade handler
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  console.log(`Received upgrade request: ${request.method} ${request.url}`);
  const upgradeHeader = request.headers.upgrade;
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    socket.destroy();
    console.error('Not a WebSocket upgrade request.');
    return;
  }

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
