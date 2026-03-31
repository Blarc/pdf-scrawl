import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import { WebSocketServer } from 'ws';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { Hocuspocus } from '@hocuspocus/server';

const host = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '1234');
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const FRONTEND_DIST = join(process.cwd(), '../frontend/dist');
const PDF_DIR = join(tmpdir(), 'pdf-rooms');

const ROOM_ID_RE = /^[a-z0-9]{8,32}$/;

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
});

const fastify = Fastify({
  logger: true,
  bodyLimit: 50 * 1024 * 1024, // 50 MB
});

// Setup
mkdir(PDF_DIR, { recursive: true }).catch(() => {});

// Plugins
fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
});

// Handle application/pdf as raw buffer
fastify.addContentTypeParser('application/pdf', { parseAs: 'buffer' }, (req, payload, done) => {
  done(null, payload);
});

// Health check
fastify.get('/health', async () => {
  return 'ok';
});

// PDF Routes
fastify.post('/room/:roomId/pdf', async (request, reply) => {
  const { roomId } = request.params as { roomId: string };
  if (!ROOM_ID_RE.test(roomId)) {
    return reply.status(400).send('Invalid room ID');
  }

  const buffer = request.body as Buffer;
  if (!buffer || buffer.length < 4 || buffer.slice(0, 4).toString() !== '%PDF') {
    return reply.status(400).send('Not a PDF');
  }

  try {
    await writeFile(join(PDF_DIR, `${roomId}.pdf`), buffer);
    return reply.status(204).send();
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send('Storage error');
  }
});

fastify.get('/room/:roomId/pdf', async (request, reply) => {
  const { roomId } = request.params as { roomId: string };
  if (!ROOM_ID_RE.test(roomId)) {
    return reply.status(400).send('Invalid room ID');
  }

  try {
    const data = await readFile(join(PDF_DIR, `${roomId}.pdf`));
    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Length', data.length)
      .send(data);
  } catch {
    return reply.status(404).send('Not found');
  }
});

// Static files (Frontend)
fastify.register(staticPlugin, {
  root: FRONTEND_DIST,
  wildcard: false, // Don't serve everything from root, we'll handle fallback
});

// SPA fallback for frontend
fastify.setNotFoundHandler(async (request, reply) => {
  // If it's an API route that wasn't found, 404
  if (request.url.startsWith('/room/') || request.url === '/health') {
    return reply.status(404).send('Not found');
  }

  // Otherwise, serve index.html for SPA
  return reply.sendFile('index.html');
});

// Hocuspocus WebSocket Upgrade handler
const wss = new WebSocketServer({ noServer: true });

const start = async () => {
  try {
    await fastify.ready();
    
    fastify.server.on('upgrade', (request, socket, head) => {
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

    await fastify.listen({ port, host });
    console.log(`Server listening on ${host}:${port}`);
    if (AUTH_TOKEN) {
      console.log('Auth enabled — clients must supply ?token=<AUTH_TOKEN>');
    } else {
      console.log('Auth disabled (set AUTH_TOKEN env var to enable)');
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
