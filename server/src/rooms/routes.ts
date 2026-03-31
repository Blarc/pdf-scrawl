import { FastifyInstance } from 'fastify';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { ROOM_ID_RE, PDF_DIR } from '../config.js';

export async function roomRoutes(fastify: FastifyInstance) {
  // PDF Routes
  fastify.post('/room/:roomId/pdf', async (request, reply) => {
    if (!request.isAuthenticated()) {
      return reply.status(401).send('Unauthorized');
    }

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
    if (!request.isAuthenticated()) {
      return reply.status(401).send('Unauthorized');
    }

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
}
