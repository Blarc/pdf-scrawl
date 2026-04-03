import Fastify from 'fastify'
import fp from 'fastify-plugin'
import serviceApp from './app.js'
import closeWithGrace from "close-with-grace";

/**
 * Do not use NODE_ENV to determine what logger (or any env related feature) to use
 * @see {@link https://www.youtube.com/watch?v=HMM7GJC5E2o}
 */
function getLoggerOptions () {
    // Only if the program is running in an interactive terminal
    if (process.stdout.isTTY || process.env.NODE_ENV === 'development') {
        return {
            level: 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname'
                }
            }
        }
    }

    return { level: process.env.LOG_LEVEL ?? 'silent' }
}

const fastify = Fastify({
    logger: getLoggerOptions(),
    bodyLimit: 50 * 1024 * 1024, // 50 MB
    // Apply recommended timeouts to prevent slow or idle clients from holding connections open
    connectionTimeout: 120_000,
    requestTimeout: 60_000,
    keepAliveTimeout: 10_000,
    http: {
        headersTimeout: 15_000
    },
    ajv: {
        customOptions: {
            coerceTypes: 'array', // change type of data to match type keyword
            removeAdditional: 'all' // Remove additional body properties
        }
    }
})

async function start () {
    // Register your application as a normal plugin.
    // fp must be used to override default error handler
    await fastify.register(fp(serviceApp))

    // Delay is the number of milliseconds for the graceful close to finish
    closeWithGrace(
        // @ts-ignore
        { delay: process.env.FASTIFY_CLOSE_GRACE_DELAY ?? 500 },
        async ({ err }) => {
            if (err != null) {
                fastify.log.error(err)
            }

            await fastify.close()
        }
    )

    await fastify.ready()

    try {
        // Start listening.
        await fastify.listen({
            port: fastify.config.PORT,
            host: '0.0.0.0'
        })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()
