import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import secureSession from '@fastify/secure-session';
import fastifyPassport from '@fastify/passport';
import fastifyCookie from '@fastify/cookie';
import { WebSocketServer } from 'ws';
import { mkdir } from 'fs/promises';

import {
  host,
  port,
  SESSION_SECRET,
  SESSION_SALT,
  FRONTEND_DIST,
  PDF_DIR
} from './config.js';
import { setupPassport } from './auth/passport.js';
import { authRoutes } from './auth/routes.js';
import { roomRoutes } from './rooms/routes.js';
import { hocuspocus } from './rooms/hocuspocus.js';

const fastify = Fastify({
  logger: true,
  bodyLimit: 50 * 1024 * 1024, // 50 MB
});

const start = async () => {
  try {
    // Setup directories
    await mkdir(PDF_DIR, { recursive: true }).catch(() => {});

    // Plugins
    fastify.register(cors, {
      origin: (origin, cb) => {
        if (!origin || /localhost:5173$/.test(origin) || /localhost:5174$/.test(origin)) {
          cb(null, true);
          return;
        }
        cb(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
    });

    fastify.register(fastifyCookie);

    fastify.addContentTypeParser('application/pdf', { parseAs: 'buffer' }, (req, payload, done) => {
      done(null, payload);
    });

    // Session and Passport Setup
    fastify.register(secureSession, {
      secret: SESSION_SECRET,
      salt: SESSION_SALT,
      cookie: {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      },
    });

    fastify.register(fastifyPassport.initialize());
    fastify.register(fastifyPassport.secureSession());

    // Initialize Passport strategies
    setupPassport();

    // Register Routes
    fastify.register(authRoutes);
    fastify.register(roomRoutes);

    // Health check
    fastify.get('/health', async () => 'ok');

    // Static files (Frontend)
    fastify.register(staticPlugin, {
      root: FRONTEND_DIST,
      wildcard: false,
    });

    // SPA fallback
    fastify.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/room/') || request.url === '/health' || request.url.startsWith('/auth/')) {
        return reply.status(404).send('Not found');
      }
      return reply.sendFile('index.html');
    });

    // WebSocket Upgrade handler
    const wss = new WebSocketServer({ noServer: true });

    fastify.server.on('upgrade', (request, socket, head) => {
      const upgradeHeader = request.headers.upgrade;
      if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        socket.destroy();
        return;
      }

      // Parse cookies from raw upgrade request for authentication in Hocuspocus
      const cookies = fastify.parseCookie(request.headers.cookie ?? '');

      const sessionCookie = cookies['session'];
      if (sessionCookie) {
        try {
          const session = fastify.decodeSecureSession(sessionCookie);
          if (session) {
            (request as any).session = session;
          }
        } catch (e) {
          console.error('Failed to decode session cookie:', e);
        }
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        hocuspocus.handleConnection(ws, request);
      });
    });

    await fastify.ready();
    await fastify.listen({ port, host });

    console.log(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
