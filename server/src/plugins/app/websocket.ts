import fp from 'fastify-plugin'
import { WebSocketServer } from 'ws'
import { Hocuspocus } from '@hocuspocus/server'

/**
 * This plugins helps to setup the WebSocket server and Hocuspocus.
 */
export default fp(async (fastify) => {
    const hocuspocus = new Hocuspocus({
        name: 'pdf-scrawl-hocuspocus',
        async onAuthenticate({ documentName, request }) {
            fastify.log.info({ documentName }, 'Authenticating Hocuspocus connection')

            const sessionCookie = fastify.parseCookie(request.headers.cookie ?? '')['session']
            if (!sessionCookie) throw new Error('Unauthorized')

            try {
                const session = fastify.decodeSecureSession(sessionCookie)
                const userId = session?.get('passport')
                if (userId) {
                    const user = await fastify.usersRepository.findById(userId)
                    if (user) {
                        fastify.log.info({ user: user.username }, 'Authenticated Hocuspocus user')
                        return
                    }
                }
            } catch (e) {
                fastify.log.error(e, 'Failed to decode session for Hocuspocus')
            }

            throw new Error('Unauthorized')
        }
    })

    const wss = new WebSocketServer({ noServer: true })

    fastify.server.on('upgrade', (request, socket, head) => {
        const upgradeHeader = request.headers.upgrade
        if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
            socket.destroy()
            return
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
            hocuspocus.handleConnection(ws, request)
        })
    })

    fastify.addHook('onClose', async () => {
        wss.close()
    })
}, {
    name: 'websocket'
})
