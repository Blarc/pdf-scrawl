import { Hocuspocus } from '@hocuspocus/server';
import { AUTH_TOKEN } from '../config.js';
import { users } from '../auth/users.js';

export const hocuspocus = new Hocuspocus({
  name: 'pdf-scrawl-hocuspocus',
  async onAuthenticate({ token, documentName, request }) {
    console.log(`Authenticating connection for document: ${documentName}`);
    
    // Check for AUTH_TOKEN (legacy)
    if (AUTH_TOKEN && token === AUTH_TOKEN) {
      return;
    }

    // Check for passport session user
    const session = (request as any).session;
    if (session) {
      const passport = session.get('passport');
      const userId = passport?.user;
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
