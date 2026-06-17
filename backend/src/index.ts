import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth.route';
import { campaignRouter } from './routes/campaign.route';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.get('/', (c) => {
  return c.json({ message: 'Wellfluence API is running!' });
});

app.route('/auth', authRouter);
app.route('/campaigns', campaignRouter);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};