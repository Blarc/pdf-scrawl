import fastifyPassport from '@fastify/passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, port } from '../config.js';
import { User, users } from './users.js';

export function setupPassport() {
  // Passport Serialization
  fastifyPassport.registerUserSerializer(async (user: User) => {
    return user.id;
  });

  fastifyPassport.registerUserDeserializer(async (id: string) => {
    return users.find((u) => u.id === id);
  });

  // Local Strategy (Username/Password)
  fastifyPassport.use(
    'local',
    new LocalStrategy(async (username, password, done) => {
      const user = users.find((u) => u.username === username);
      if (!user || !user.password) {
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      return done(null, user);
    })
  );

  // Google Strategy
  fastifyPassport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `http://localhost:${port}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        let user = users.find((u) => u.googleId === profile.id);
        if (!user) {
          user = {
            id: Math.random().toString(36).substring(2, 15),
            googleId: profile.id,
            displayName: profile.displayName || profile.emails?.[0]?.value || 'Google User',
          };
          users.push(user);
        }
        return done(null, user);
      }
    )
  );
}
