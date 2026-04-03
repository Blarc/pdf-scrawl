import env from '@fastify/env'
import fp from 'fastify-plugin'

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            PORT: number;
            COOKIE_SECRET: string;
            COOKIE_NAME: string;
            COOKIE_SALT: string;
            COOKIE_SECURED: boolean;
            RATE_LIMIT_MAX: number;
            PDF_DIR: string;
            GOOGLE_CLIENT_ID: string;
            GOOGLE_CLIENT_SECRET: string;
        };
    }
}

const schema = {
    type: 'object',
    required: [
        'COOKIE_SECRET',
        'COOKIE_NAME',
        'COOKIE_SALT',
    ],
    properties: {
        PORT: {
            type: 'number',
            default: 3000
        },
        // Security
        COOKIE_SECRET: {
            type: 'string'
        },
        COOKIE_NAME: {
            type: 'string'
        },
        COOKIE_SALT: {
            type: 'string'
        },
        COOKIE_SECURED: {
            type: 'boolean',
            default: false
        },
        RATE_LIMIT_MAX: {
            type: 'number',
            default: 100
        },
        PDF_DIR: {
            type: 'string',
            default: 'pdf-rooms'
        },
        GOOGLE_CLIENT_ID: {
            type: 'string'
        },
        GOOGLE_CLIENT_SECRET: {
            type: 'string'
        }
    }
}

/**
 * This plugin validates and exposes environment variables as `fastify.config`.
 */
export default fp(async (fastify) => {
    await fastify.register(env, {
        confKey: 'config',
        schema,
        dotenv: true,
        data: process.env
    })
}, {
    name: 'env'
})
