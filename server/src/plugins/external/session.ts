import fp from 'fastify-plugin'
import fastifyCookie from '@fastify/cookie'
import secureSession from '@fastify/secure-session'
import fastifyPassport from '@fastify/passport'
import {Strategy as LocalStrategy} from 'passport-local'
import {Strategy as GoogleStrategy} from 'passport-google-oauth20'
import bcrypt from 'bcrypt'
import {User} from "../../db/schema";
import {FastifyRequest} from "fastify";

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
    { usernameField: 'email'},
    async (email, password, done) => {
      fastify.log.info(`Authenticating user with email: ${email}`);
      const user = await fastify.usersRepository.findByEmail(email)
      if (!user) {
        return done(null, false)
      }

      const isValidPassword = bcrypt.compare(password, user.password || '')
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

        let user = await fastify.usersRepository.findByEmail(email)
        if (!user) {
          user = await fastify.usersRepository.createAndGetUser({
            username: profile.displayName,
            email: email,
            googleId: profile.id
          })
          fastify.log.info(`Created new user with email ${email} and Google ID ${profile.id}`)
        }
        return done(null, user)
      }
    ))
  }

  fastifyPassport.registerUserSerializer(async (user: User, _request: FastifyRequest) => user.id)
  fastifyPassport.registerUserDeserializer(async (id: string, _request: FastifyRequest) => {
    try {
      const user = await fastify.usersRepository.findById(id)
      return user ?? null
    } catch (error) {
      fastify.log.warn({error, userId: id}, 'Failed to deserialize user from session')
      return null
    }
  })
}, {
  name: 'session',
  dependencies: ['env']
})
