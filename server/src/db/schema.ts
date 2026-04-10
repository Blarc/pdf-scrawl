import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { sqliteTable, text as sqliteText } from 'drizzle-orm/sqlite-core';
import {InferInsertModel, InferSelectModel} from "drizzle-orm";


// choose at runtime
const isPg = process.env.DATABASE_TYPE === "postgres";

export const users = isPg
    ? pgTable("users", {
        id: uuid("id").primaryKey().defaultRandom(),
        googleId: text("google_id").unique(),
        username: text("username").notNull().unique(),
        password: text("password"),
        email: text("email").notNull().unique()
    })
    : sqliteTable("users", {
        id: sqliteText("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        googleId: sqliteText("google_id").unique(),
        username: sqliteText("username").notNull().unique(),
        password: sqliteText("password"),
        email: sqliteText("email").notNull().unique()
    });

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;