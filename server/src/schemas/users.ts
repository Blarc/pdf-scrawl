import {Type} from 'typebox'
import {PasswordSchema} from "./common";

export const UpdateCredentialsSchema = Type.Object({
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema
})
