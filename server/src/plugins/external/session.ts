import fp from 'fastify-plugin'
import fastifyCookie from '@fastify/cookie'
import secureSession from '@fastify/secure-session'
import fastifyPassport from '@fastify/passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import bcrypt from 'bcrypt'
import { User } from '../../schemas/user'

declare module 'fastify' {
    interface Session {
        user: User
    }
}

/**
 * This plugins enables the use of session and authentication.
 */
export default fp(async (fastify) => {
    fastify.register(fastifyCookie)
    fastify.register(secureSession, {
        secret: fastify.config.COOKIE_SECRET,
        cookieName: fastify.config.COOKIE_NAME,
        salt: fastify.config.COOKIE_SALT,
        cookie: {
            httpOnly: true,
            maxAge: 1800000,
            secure: fastify.config.COOKIE_SECURED,
            sameSite: fastify.config.COOKIE_SECURED ? 'strict' : 'lax',
            path: '/'
        }
    })

    fastify.register(fastifyPassport.initialize())
    fastify.register(fastifyPassport.secureSession())

    fastifyPassport.use('local', new LocalStrategy(
        async (username, password, done) => {
            const user = await fastify.usersRepository.findByUsername(username)
            if (!user) {
                return done(null, false)
            }

            const isValidPassword = await bcrypt.compare(password, user.password)
            if (!isValidPassword) {
                return done(null, false)
            }

            return done(null, user)
        }
    ))

    if (fastify.config.GOOGLE_CLIENT_ID && fastify.config.GOOGLE_CLIENT_SECRET) {
        fastifyPassport.use('google', new GoogleStrategy({
                clientID: fastify.config.GOOGLE_CLIENT_ID,
                clientSecret: fastify.config.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback'
            },
            async (_accessToken, _refreshToken, profile, done) => {
                const email = profile.emails?.[0].value
                if (!email) return done(new Error('No email found'))

                let user = await fastify.usersRepository.findById(profile.id)
                if (!user) {
                    user = await fastify.usersRepository.addUser({
                        id: profile.id,
                        username: profile.displayName,
                        password: ''
                    })
                }
                return done(null, user)
            }
        ))
    }

    fastifyPassport.registerUserSerializer(async (user: User, _request: any) => user.id)
    fastifyPassport.registerUserDeserializer(async (id: string, _request: any) => {
        return await fastify.usersRepository.findById(id)
    })
}, {
    name: 'session',
    dependencies: ['env']
})
