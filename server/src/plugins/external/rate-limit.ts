import fp from 'fastify-plugin'
import fastifyRateLimit from '@fastify/rate-limit'

/**
 * This plugins is low overhead rate limiter for your routes.
 *
 * @see {@link https://github.com/fastify/fastify-rate-limit}
 */
export default fp(async (fastify) => {
    await fastify.register(fastifyRateLimit, {
        max: fastify.config.RATE_LIMIT_MAX,
        timeWindow: '1 minute'
    })
}, {
    name: 'rate-limit',
    dependencies: ['env']
})
