import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { serve } from '@hono/node-server'; 
import 'dotenv/config';

import { authRouter } from './routes/auth.route';
import { influencerRouter } from './routes/influencer.route';

const app = new Hono();

// Middleware
app.use(logger());

// แก้ไขตรงนี้: เปิดใจรับทุก Domain ที่มาจาก Vercel และ Localhost
app.use(cors({
  origin: (origin) => {
    if (!origin || origin.includes('localhost') || origin.includes('vercel.app')) {
      return origin;
    }
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Routes
app.get('/', (c) => c.json({ message: 'Wellfluence API is running!' }));
app.route('/auth', authRouter);
app.route('/influencers', influencerRouter);

// Error Handling
app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json({
      success: false,
      message: 'Validation error',
      errors: err.issues,
    }, 400);
  }

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error(err);
  return c.json({ success: false, message: 'An unexpected error occurred.' }, 500);
});

const port = Number(process.env.PORT) || 8000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port: port
});

export default {
  port,
  fetch: app.fetch,
};
