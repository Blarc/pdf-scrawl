import {FastifyPluginAsync, FastifyRequest} from 'fastify'
import fastifyPassport from "@fastify/passport";
import bcrypt from 'bcrypt';
import Type from "typebox";
import {LoginDtoSchema, RegisterDto, RegisterDtoSchema} from "../../../schemas/auth";

const plugin: FastifyPluginAsync = async (fastify) => {
    fastify.post(
        '/login',
        {
            schema: {
                body: LoginDtoSchema,
                response: {
                    200: Type.Object({
                        success: Type.Boolean(),
                        message: Type.Optional(Type.String())
                    }),
                    401: Type.Object({
                        message: Type.String()
                    })
                },
                tags: ['Authentication']
            },
            preValidation: fastifyPassport.authenticate('local') as any
        },
        async () => {
            fastify.log.info('User logged in');
            return { success: true }
        }
    );

    fastify.post(
        '/register',
        {
            schema: {
                body: RegisterDtoSchema,
                tags: ['Authentication']
            }
        },
        async (request: FastifyRequest<{ Body: RegisterDto }>, reply) => {
            const { username, email, password } = request.body;

            fastify.log.info(`Registering user: ${username} (${email})`);


            // Check username uniqueness
            if (await fastify.usersRepository.findByUsername(username)) {
                return reply.status(400).send({ error: 'Username already exists' });
            }

            // Check email uniqueness
            if (await fastify.usersRepository.findByEmail(email)) {
                return reply.status(400).send({ error: 'Email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await fastify.usersRepository.createAndGetUser({
                username,
                email,
                password: hashedPassword,
            });

            return reply.status(201).send({
                id: user.id,
                username: user.username,
            });
        }
    );

    fastify.get('/logout', async (request) => {
        await request.logout();
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
