import { Hocuspocus } from '@hocuspocus/server';
import { users } from '../auth/users.js';

export const hocuspocus = new Hocuspocus({
  name: 'pdf-scrawl-hocuspocus',
  async onAuthenticate({ documentName, request }) {
    console.log(`Authenticating connection for document: ${documentName}`);
    
    // Check for passport session user which is attached to request in server.ts
    // upgrade handler, where cookies are parsed and decoded
    const session = (request as any).session;
    if (session) {
      // @fastify/passport stores the serialized user directly under "passport".
      // serialization is defined in auth/passport.ts
      const userId = session.get('passport');
      if (userId) {
        const user = users.find((u) => u.id === userId);
        if (user) {
          console.log(`Authenticated user via session: ${user.displayName}`);
          return;
        }
      }
    }

    throw new Error('Unauthorized');
  },
  async onConnect({ documentName }) {
    console.log(`New connection to document: ${documentName}`);
  },
});
