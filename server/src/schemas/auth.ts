import {Static, Type} from 'typebox'
import {EmailSchema, PasswordSchema, StringSchema} from './common.js'

export const LoginDtoSchema = Type.Object({
    email: EmailSchema,
    password: StringSchema
})

export type LoginDto = Static<typeof LoginDtoSchema>

export const RegisterDtoSchema = Type.Object({
    username: StringSchema,
    email: EmailSchema,
    password: PasswordSchema,
});

export type RegisterDto = Static<typeof RegisterDtoSchema>;