import { createMiddleware } from 'hono/factory';
import { verifyJwt } from '../lib/auth';
import { HTTPException } from 'hono/http-exception';
import { UserRole } from '@prisma/client';

export interface AuthVariables {
  userId: string;
  email: string;
  role: UserRole;
}

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Authentication token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyJwt(token);
    c.set('userId', payload.userId);
    c.set('email', payload.email);
    c.set('role', payload.role);
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }
});

export const authorizeRoles = (...roles: UserRole[]) =>
  createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const userRole = c.get('role');
    if (!roles.includes(userRole)) {
      throw new HTTPException(403, { message: 'Forbidden: Insufficient permissions' });
    }
    await next();
  });