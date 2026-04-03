import fastifyStatic from '@fastify/static'
import fp from 'fastify-plugin'
import { join } from 'node:path'

/**
 * This plugins allows to serve static files as fast as possible.
 *
 * @see {@link https://github.com/fastify/fastify-static}
 */
export default fp(async (fastify) => {
    fastify.register(fastifyStatic, {
        // Runtime layout expects server cwd at /app/server and frontend build at /app/frontend/dist.
        root: join(process.cwd(), '../frontend/dist'),
        wildcard: false,
    })

    fastify.setNotFoundHandler((request, reply) => {
        // SPA fallback
        if (!request.url.startsWith('/api/') && !request.url.startsWith('/auth/')) {
            return reply.sendFile('index.html')
        }

        request.log.warn({ url: request.url }, 'Resource not found')
        reply.code(404)
        return { message: 'Not Found' }
    })
}, {
    name: 'static'
})
