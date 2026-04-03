import { FastifyInstance } from 'fastify'

/**
 * Root routes for health check.
 */
export default async function (fastify: FastifyInstance) {
    fastify.get('/health', async () => 'ok')
}
