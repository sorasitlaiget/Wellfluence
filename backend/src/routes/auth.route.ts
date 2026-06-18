import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { signJwt } from '../lib/auth';
import { UserRole } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

export const authRouter = new Hono();

const registerSchema = z.object({
  email: z.string().email('Invalid email format.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  role: z.nativeEnum(UserRole).refine(role => role !== UserRole.ADMIN, {
    message: "Cannot register as ADMIN directly.",
  }),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format.'),
  password: z.string().min(1, 'Password is required.'),
});

authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, role } = c.req.valid('json');

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new HTTPException(409, { message: 'User with this email already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      role,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  const token = await signJwt({ userId: newUser.id, role: newUser.role });

  return c.json({
    success: true,
    message: 'Registration successful.',
    token,
    user: newUser,
  }, 201);
});

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HTTPException(401, { message: 'Invalid credentials.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new HTTPException(401, { message: 'Invalid credentials.' });
  }

  const token = await signJwt({ userId: user.id, role: user.role });

  return c.json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});