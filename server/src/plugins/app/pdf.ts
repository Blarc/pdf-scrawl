import { mkdir } from 'fs/promises'
import fp from 'fastify-plugin'

/**
 * This plugins helps to setup the PDF directory and content type parser.
 */
export default fp(async (fastify) => {
    // Setup PDF directory
    await mkdir(fastify.config.PDF_DIR, { recursive: true }).catch(() => {})

    // Add application/pdf content type parser
    fastify.addContentTypeParser('application/pdf', { parseAs: 'buffer' }, (_req, payload, done) => {
        done(null, payload)
    })
}, {
    name: 'pdf'
})
