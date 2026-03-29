export const USER_NAME = `User-${Math.floor(Math.random() * 9000) + 1000}`;

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const WS_URL = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`;
export const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}`;

/** Read the room ID from the URL hash, e.g. "#abc123" → "abc123". */
export function getRoomFromHash(): string | null {
  const hash = window.location.hash.slice(1);
  return hash.length > 0 ? hash : null;
}

/** Generate a short random room ID (lowercase alphanumeric, 16 chars). */
export function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10);
}
