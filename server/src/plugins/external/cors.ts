import cors, { FastifyCorsOptions } from '@fastify/cors'

export const autoConfig: FastifyCorsOptions = {
    origin: (origin, cb) => {
        if (!origin || /localhost:5173$/.test(origin) || /localhost:5174$/.test(origin)) {
            cb(null, true);
            return;
        }
        cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}

/**
 * This plugins enables the use of CORS.
 *
 * @see {@link https://github.com/fastify/fastify-cors}
 */
export default cors