import { FastifyInstance } from 'fastify';
import fastifyPassport from '@fastify/passport';
import bcrypt from 'bcrypt';
import { User, users } from './users.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/register', async (request, reply) => {
    const { username, password, displayName } = request.body as any;
    if (!username || !password) {
      return reply.status(400).send('Username and password are required');
    }

    if (users.find((u) => u.username === username)) {
      return reply.status(400).send('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
      id: Math.random().toString(36).substring(2, 15),
      username,
      password: hashedPassword,
      displayName: displayName || username,
    };
    users.push(user);

    return reply.status(201).send({ id: user.id, username: user.username, displayName: user.displayName });
  });

  fastify.post(
    '/auth/login',
    { preValidation: fastifyPassport.authenticate('local') as any },
    async (request, reply) => {
      return request.user;
    }
  );

  fastify.get(
    '/auth/google',
    {
      preHandler: async (request, reply) => {
        const { returnTo } = request.query as { returnTo?: string };
        if (returnTo) {
          request.session.set('returnTo', returnTo);
        }
      },
      preValidation: fastifyPassport.authorize('google', { scope: ['profile', 'email'] }) as any,
    },
    async (request, reply) => {
      // Redirects to Google
    }
  );

  fastify.get(
    '/auth/google/callback',
    { preValidation: fastifyPassport.authenticate('google', { failureRedirect: '/login' }) as any },
    async (request, reply) => {
      const returnTo = request.session.get('returnTo');
      if (returnTo) {
        request.session.set('returnTo', undefined);
        return reply.redirect(returnTo);
      }
      return reply.redirect('/');
    }
  );

  fastify.get('/auth/logout', async (request, reply) => {
    request.logout();
    return { success: true };
  });

  fastify.get('/auth/me', async (request, reply) => {
    if (request.isAuthenticated()) {
      return request.user;
    }
    return reply.status(401).send({ error: 'Not authenticated' });
  });
}
