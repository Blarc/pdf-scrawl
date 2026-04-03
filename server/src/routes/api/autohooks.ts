import { FastifyInstance } from 'fastify'

export default async function (fastify: FastifyInstance) {
    fastify.addHook('preHandler', async (request, reply) => {
        // Skip authentication for login, register, and google auth
        const publicRoutes = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/google',
            '/api/auth/google/callback'
        ]

        if (publicRoutes.some(route => request.url.startsWith(route))) {
            return
        }

        if (!request.isAuthenticated()) {
            reply.code(401).send({ message: 'You must be authenticated to access this route.' })
        }
    })
}
