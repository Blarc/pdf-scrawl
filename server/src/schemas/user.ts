import { Static, Type } from 'typebox'
import { StringSchema } from './common.js'

export const CredentialsSchema = Type.Object({
    username: StringSchema,
    password: StringSchema
})

export interface Credentials extends Static<typeof CredentialsSchema> {}

export interface User {
    id: string;
    username: string;
    password: string;
}

// TODO: adjust
const passwordPattern = '*'

const PasswordSchema = Type.String({
    pattern: passwordPattern,
    // TODO: adjust
    minLength: 1
})

export const UpdateCredentialsSchema = Type.Object({
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema
})