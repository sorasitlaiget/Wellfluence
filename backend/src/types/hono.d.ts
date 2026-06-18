import { Hono } from 'hono';
import { UserRole } from '@prisma/client';

// This extends Hono's Context type to include the properties set by our middleware.
declare module 'hono' {
  interface ContextRenderer {
    // Define any custom properties you set on `c` here.
    // For example, if you use `c.set('userId', id)`, you'd add it here.
  }
  interface Context {
    get(key: 'userId'): string | undefined;
    get(key: 'userRole'): UserRole | undefined;
  }
}

// You can also define a more specific context type if needed for middleware or routes
export type HonoContext = Hono['Context'];