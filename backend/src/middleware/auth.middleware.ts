import { createMiddleware } from 'hono/factory';
import { verifyJwt } from '../lib/auth';
import { HTTPException } from 'hono/http-exception';
import { UserRole } from '@prisma/client'; // Import UserRole enum

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new HTTPException(401, { message: 'Token not provided.' });
  }

  try {
    const payload = await verifyJwt(token);
    if (!payload.userId || !payload.role) {
      throw new HTTPException(401, { message: 'Invalid token payload.' });
    }
    c.set('userId', payload.userId as string);
    c.set('userRole', payload.role as UserRole);
    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(401, { message: 'Authentication failed.' });
  }
});

export const authorizeRole = (requiredRole: UserRole | UserRole[]) => createMiddleware(async (c, next) => {
  await authMiddleware(c, async () => { // Ensure authMiddleware runs first
    const userRole = c.get('userRole');
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new HTTPException(403, { message: 'Forbidden: Insufficient permissions.' });
    }
    await next();
  });
});