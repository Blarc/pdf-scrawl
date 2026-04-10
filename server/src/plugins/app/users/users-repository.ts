import {FastifyInstance} from 'fastify'
import fp from 'fastify-plugin'
import {eq} from 'drizzle-orm'
import {NewUser, User} from "../../../db/schema";

declare module 'fastify' {
    interface FastifyInstance {
        usersRepository: ReturnType<typeof createUsersRepository>;
    }
}

export function createUsersRepository(fastify: FastifyInstance) {
    const {db, dbSchema} = fastify;
    const usersTable = dbSchema.users;

    return {
        async findById(id: string): Promise<User | undefined> {
            const result = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
            return result[0];
        },

        async findByUsername(username: string): Promise<User | undefined> {
            const result = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
            return result[0];
        },

        async findByEmail(email: string): Promise<User | undefined> {
            const result = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
            return result[0];
        },

        async createAndGetUser(newUser: NewUser): Promise<User> {
            const id = newUser.id ?? crypto.randomUUID();

            await db.insert(usersTable).values({
                ...newUser,
                id,
            });

            const user = await this.findById(id)
            if (!user) throw new Error("Insert failed");
            return user;
        }
    }
}

export default fp(
    async function (fastify: FastifyInstance) {
        const repo = createUsersRepository(fastify)
        fastify.decorate('usersRepository', repo)
    },
    {
        name: 'users-repository',
        dependencies: ['db']
    }
)
