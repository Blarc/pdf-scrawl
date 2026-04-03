import path from 'node:path'
import fastifyAutoload from '@fastify/autoload'
import { FastifyError, FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function serviceApp (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions
) {
    delete opts.skipOverride // This option only serves testing purpose
    // This loads all external plugins defined in plugins/external
    // those should be registered first as your application plugins might depend on them
    await fastify.register(fastifyAutoload, {
        dir: path.join(import.meta.dirname, 'plugins/external'),
        options: { ...opts }
    })

    // This loads all your application plugins defined in plugins/app
    // those should be support plugins that are reused
    // through your application
    await fastify.register(fastifyAutoload, {
        dir: path.join(import.meta.dirname, 'plugins/app'),
        options: { ...opts }
    })

    // This loads all plugins defined in routes
    // define your routes in one of these
    await fastify.register(fastifyAutoload, {
        dir: path.join(import.meta.dirname, 'routes'),
        autoHooks: true,
        cascadeHooks: true,
        options: { ...opts }
    })

    fastify.setErrorHandler((err: FastifyError, request, reply) => {
        fastify.log.error(
            {
                err,
                request: {
                    method: request.method,
                    url: request.url,
                    query: request.query,
                    params: request.params
                }
            },
            'Unhandled error occurred'
        )

        reply.code(err.statusCode ?? 500)

        let message = 'Internal Server Error'
        if (err.statusCode && err.statusCode < 500) {
            message = err.message
        }

        return { message }
    })
}
