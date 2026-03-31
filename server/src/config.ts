import { join } from 'path';
import { tmpdir } from 'os';
import dotenv from 'dotenv';

dotenv.config();

export const host = process.env.HOST || '0.0.0.0';
export const port = parseInt(process.env.PORT || '1234');
export const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Google OAuth placeholders (should be env vars in production)
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const SESSION_SECRET = process.env.SESSION_SECRET || '';

export const FRONTEND_DIST = join(process.cwd(), '../frontend/dist');
export const PDF_DIR = join(tmpdir(), 'pdf-rooms');

export const ROOM_ID_RE = /^[a-z0-9]{8,32}$/;
