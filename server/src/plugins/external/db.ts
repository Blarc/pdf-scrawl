import fp from 'fastify-plugin';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite } from 'drizzle-orm/bun-sqlite';
import postgres from 'postgres';
import { Database } from 'bun:sqlite';
import * as schema from '../../db/schema.js';

declare module 'fastify' {
    interface FastifyInstance {
        db: any; // Type varies by driver, so 'any' is used here for brevity
        dbSchema: typeof schema;
    }
}

export default fp(async (fastify) => {
    const { DATABASE_TYPE, DATABASE_URL } = fastify.config;

    if (DATABASE_TYPE === 'postgres') {
        const queryClient = postgres(DATABASE_URL);
        const db = drizzlePg(queryClient, { schema });
        fastify.decorate('db', db);
    } else {
        const sqlite = new Database(DATABASE_URL);
        const db = drizzleSqlite(sqlite, { schema });
        fastify.decorate('db', db);
    }

    fastify.decorate('dbSchema', schema);
}, {
    name: 'db',
    dependencies: ['env']
});
