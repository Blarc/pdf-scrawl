// ---------------------------------------------------------------------------
// User Mock Database and Types
// ---------------------------------------------------------------------------
export interface User {
  id: string;
  username?: string;
  password?: string; // Hashed
  googleId?: string;
  displayName: string;
}

// In a real app, this would be a database connection.
export const users: User[] = [];
