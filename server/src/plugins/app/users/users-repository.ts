import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { User } from '../../../schemas/user'

const users: User[] = [];

declare module 'fastify' {
    interface FastifyInstance {
        usersRepository: ReturnType<typeof createUsersRepository>;
    }
}

export function createUsersRepository (fastify: FastifyInstance) {
    return {
        async findById (id: string) {
            return users.find((user) => user.id === id)
        },

        async findByUsername (username: string) {
            return users.find((user) => user.username === username)
        },

        async addUser (user: User) {
            users.push(user)
            return user
        }
    }
}

export default fp(
    async function (fastify: FastifyInstance) {
        const repo = createUsersRepository(fastify)
        fastify.decorate('usersRepository', repo)
    },
    {
        name: 'users-repository'
    }
)