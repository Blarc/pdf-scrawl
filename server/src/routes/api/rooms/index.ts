import { FastifyPluginAsync } from 'fastify'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const ROOM_ID_RE = /^[a-z0-9]{16}$/i

const plugin: FastifyPluginAsync = async (fastify) => {
    fastify.post('/:roomId/pdf', async (request, reply) => {
        const { roomId } = request.params as { roomId: string }
        if (!ROOM_ID_RE.test(roomId)) {
            fastify.log.error('Invalid room ID')
            return reply.status(400).send('Invalid room ID')
        }

        const buffer = request.body as Buffer
        if (!buffer || buffer.length < 4 || buffer.slice(0, 4).toString() !== '%PDF') {
            fastify.log.error('Not a PDF')
            return reply.status(400).send('Not a PDF')
        }

        try {
            await writeFile(join(fastify.config.PDF_DIR, `${roomId}.pdf`), buffer)
            return reply.status(204).send()
        } catch (err) {
            fastify.log.error(err)
            return reply.status(500).send('Storage error')
        }
    })

    fastify.get('/:roomId/pdf', async (request, reply) => {
        const { roomId } = request.params as { roomId: string }
        if (!ROOM_ID_RE.test(roomId)) {
            return reply.status(400).send('Invalid room ID')
        }

        try {
            const data = await readFile(join(fastify.config.PDF_DIR, `${roomId}.pdf`))
            return reply
                .header('Content-Type', 'application/pdf')
                .header('Content-Length', data.length)
                .send(data)
        } catch {
            return reply.status(404).send('Not found')
        }
    })
}

export default plugin
