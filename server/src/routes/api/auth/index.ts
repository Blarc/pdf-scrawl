import { FastifyPluginAsync } from 'fastify'
import { User, CredentialsSchema } from '../../../schemas/user'
import fastifyPassport from "@fastify/passport";
import bcrypt from 'bcrypt';

const plugin: FastifyPluginAsync = async (fastify) => {
    fastify.post(
        '/login',
        {
            schema: {
                body: CredentialsSchema,
                tags: ['Authentication']
            },
            preValidation: fastifyPassport.authenticate('local') as any
        },
        async (request) => {
            return request.user;
        }
    );

    fastify.post(
        '/register',
        {
            schema: {
                body: CredentialsSchema,
                tags: ['Authentication']
            }
        },
        async (request, reply) => {
            const { username, password } = request.body as any;
            if (!username || !password) {
                return reply.status(400).send('Username and password are required');
            }

            if (await fastify.usersRepository.findByUsername(username)) {
                return reply.status(400).send('Username already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user: User = await fastify.usersRepository.addUser({
                id: Math.random().toString(36).substring(2, 15),
                username,
                password: hashedPassword,
            });

            return reply.status(201).send({ id: user.id, username: user.username });
        });

    fastify.get('/logout', async (request) => {
        request.logout();
        return { success: true };
    });

    fastify.get('/me', async (request, reply) => {
        if (request.isAuthenticated()) {
            return request.user;
        }
        return reply.status(401).send({ error: 'Not authenticated' });
    });

    // Google OAuth
    fastify.get('/google', {
        preValidation: fastifyPassport.authenticate('google', { scope: ['profile', 'email'] }) as any
    }, async () => {
        // Redirects to Google
    })

    fastify.get('/google/callback', {
        preValidation: fastifyPassport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/login'
        }) as any
    }, async () => {
        // Redirects to successRedirect
    })
}

export default plugin
