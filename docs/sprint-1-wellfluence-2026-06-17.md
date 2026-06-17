# Sprint 1: Wellfluence

> Goal: Foundation — Prisma schema + Hono.js API + Next.js landing page
> Date: 2026-06-17

---

## Sprint Summary

✅ ฟีเจอร์ที่สร้างเสร็จแล้ว / Features Implemented
• สร้างโครงสร้างโปรเจกต์ Hono.js (backend) และ Next.js (frontend) พื้นฐาน (Established foundational Hono.js (backend) and Next.js (frontend) project structures)
• ตั้งค่าการกำหนดค่า (tsconfig) และจัดการตัวแปรสภาพแวดล้อม (.env

---

## Code

===FILE: backend/package.json===
{
  "name": "wellfluence-backend",
  "version": "1.0.0",
  "description": "Wellfluence B2B2C Influencer Marketing Platform Backend",
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "tsc",
    "postinstall": "prisma generate",
    "db:migrate:dev": "prisma migrate dev",
    "db:push": "prisma db push"
  },
  "keywords": [],
  "author": "Wellfluence Team",
  "license": "ISC",
  "dependencies": {
    "@hono/zod-validator": "^0.2.2",
    "@prisma/client": "^5.14.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "hono": "^4.3.5",
    "jose": "^5.3.0",
    "zod": "^3.23.8"
  ",
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.12.12",
    "prisma": "^5.14.0",
    "tsx": "^4.11.0",
    "typescript": "^5.4.5"
  }
}
===ENDFILE===
===FILE: backend/tsconfig.json===
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "allowJs": true,
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.js",
    "src/**/*.jsx",
    "prisma/**/*.ts",
    "prisma/**/*.js"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
===ENDFILE===
===FILE: backend/.env.example===
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
JWT_SECRET="your_very_strong_and_long_jwt_secret_key_here_for_wellfluence"
PORT=8000
FRONTEND_URL="http://localhost:3000"
ADMIN_EMAIL="admin@wellfluence.com"
ADMIN_PASSWORD="admin_strong_password"
===ENDFILE===
===FILE: backend/src/index.ts===
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from 'hono/adapter';
import authRoutes from './routes/auth.route';
import campaignRoutes from './routes/campaign.route';
import { HTTPException } from 'hono/http-exception';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = new Hono();

// Configure CORS
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const frontendUrl = env<{ FRONTEND_URL: string }>(c).FRONTEND_URL || 'http://localhost:3000';
      if (origin === frontendUrl || origin.endsWith('.wellfluence.com')) { // Allow frontend URL and future production domains
        return origin;
      }
      return [frontendUrl, 'http://localhost:5173']; // Fallback for dev, could be more restrictive
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Health check endpoint
app.get('/', (c) => c.json({ message: 'Wellfluence Backend API is running!' }));

// Mount routes
app.route('/auth', authRoutes);
app.route('/campaigns', campaignRoutes);

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    // Expected errors from Hono's HTTPException
    console.error(`HTTP Error: ${err.message} Status: ${err.status}`);
    return c.json({ error: err.message }, err.status);
  } else if (err instanceof Error) {
    // Unexpected server errors
    console.error(`Unhandled Error: ${err.message}`, err.stack);
    return c.json({ error: 'Internal Server Error', details: err.message }, 500);
  }
  console.error('Unknown Error:', err);
  return c.json({ error: 'An unknown error occurred' }, 500);
});

const port = parseInt(process.env.PORT || '8000');
console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch
};
===ENDFILE===
===FILE: backend/src/lib/prisma.ts===
import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the PrismaClient instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Ensure a single instance of PrismaClient is used across the application
const prisma = global.prisma || new PrismaClient({
  log: ['warn', 'error'], // Log only warnings and errors
});

// In development, store the PrismaClient instance on the global object
// so it's not recreated on hot reloads.
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma;
===ENDFILE===
===FILE: backend/src/lib/auth.ts===
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}
const secret = new TextEncoder().encode(JWT_SECRET);
const ALGORITHM = 'HS256';

export interface UserPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Signs a JWT token with user payload.
 * @param payload - User data to embed in the token.
 * @returns A promise that resolves to the signed JWT string.
 */
export async function signJwt(payload: UserPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('24h') // Token expires in 24 hours
    .sign(secret);
}

/**
 * Verifies a JWT token and returns its payload.
 * @param token - The JWT string to verify.
 * @returns A promise that resolves to the decoded UserPayload.
 * @throws {Error} If the token is invalid or expired.
 */
export async function verifyJwt(token: string): Promise<UserPayload> {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: [ALGORITHM],
  });
  return payload as UserPayload;
}

/**
 * Hashes a plain text password using bcrypt.
 * @param password - The plain text password.
 * @returns A promise that resolves to the hashed password string.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain text password with a hashed password.
 * @param password - The plain text password.
 * @param hash - The hashed password.
 * @returns A promise that resolves to true if passwords match, false otherwise.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
===ENDFILE===
===FILE: backend/src/middleware/auth.middleware.ts===
import { createMiddleware } from 'hono/factory';
import { verifyJwt, UserPayload } from '../lib/auth';
import { HTTPException } from 'hono/http-exception';
import { UserRole } from '@prisma/client';

declare module 'hono' {
  interface ContextRenderer {
    // Add custom properties to the Hono Context
    user?: UserPayload;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Unauthorized: No token provided or invalid format.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyJwt(token);
    c.set('user', payload); // Store user payload in context
    await next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new HTTPException(401, { message: 'Unauthorized: Invalid or expired token.' });
  }
});

/**
 * Middleware to restrict access based on user role.
 * @param allowedRoles - An array of roles that are allowed to access the route.
 */
export const roleMiddleware = (allowedRoles: UserRole[]) => createMiddleware(async (c, next) => {
  const user = c.get('user');

  if (!user || !allowedRoles.includes(user.role)) {
    throw new HTTPException(403, { message: 'Forbidden: Insufficient permissions.' });
  }
  await next();
});
===ENDFILE===
===FILE: backend/src/routes/auth.route.ts===
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../lib/prisma';
import { signJwt, hashPassword, comparePassword } from '../lib/auth';
import { UserRole } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Invalid role. Must be BRAND or INFLUENCER' }),
  }),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, role } = c.req.valid('json');

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new HTTPException(409, { message: 'User with this email already exists.' });
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        ...(role === UserRole.BRAND && {
          brandProfile: {
            create: {
              companyName: 'New Brand', // Placeholder, to be updated by brand
              industry: 'Health & Wellness',
            },
          },
        }),
        ...(role === UserRole.INFLUENCER && {
          influencerProfile: {
            create: {
              bio: 'New Influencer', // Placeholder, to be updated by influencer
              expertise: 'Wellness',
            },
          },
        }),
      },
      include: {
        brandProfile: role === UserRole.BRAND,
        influencerProfile: role === UserRole.INFLUENCER,
      },
    });

    const token = await signJwt({ userId: user.id, email: user.email, role: user.role });

    return c.json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        brandProfileId: user.brandProfile?.id,
        influencerProfileId: user.influencerProfile?.id,
      },
    }, 201);
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new HTTPException(500, { message: `Registration failed: ${error.message}` });
  }
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new HTTPException(401, { message: 'Invalid credentials.' });
  }

  const token = await signJwt({ userId: user.id, email: user.email, role: user.role });

  return c.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

export default auth;
===ENDFILE===
===FILE: backend/src/routes/campaign.route.ts===
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../lib/prisma';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole, CampaignStatus } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

const campaignRoutes = new Hono();

// Schemas for Campaign creation/update
const campaignCreateSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters.'),
  description: z.string().min(10, 'Campaign description must be at least 10 characters.'),
  objectives: z.string().array().nonempty('Objectives cannot be empty.'),
  targetAudience: z.object({
    age: z.string(), // e.g., "18-35"
    gender: z.string().optional(),
    interests: z.string().array(),
    location: z.string().optional(),
  }),
  influencerCriteria: z.object({
    niche: z.string(),
    followerCountRange: z.string(), // e.g., "10000-50000"
    engagementRateRange: z.string().optional(), // e.g., "3-5%"
  }),
  budget: z.object({
    amount: z.number().positive('Budget amount must be positive.'),
    currency: z.string().length(3).default('THB'),
    model: z.string(), // e.g., "FIXED_FEE", "PRODUCT_SAMPLES", "COMMISSION"
  }),
  deliverables: z.string().array().nonempty('Deliverables cannot be empty.'),
  kpis: z.string().array().nonempty('KPIs cannot be empty.'),
  timelineStart: z.string().datetime('Invalid start date time format.').optional(),
  timelineEnd: z.string().datetime('Invalid end date time format.').optional(),
});

const campaignUpdateSchema = campaignCreateSchema.partial().extend({
  status: z.nativeEnum(CampaignStatus).optional(),
});

// GET all campaigns (visible to all authenticated users, influencers see opportunities)
campaignRoutes.get('/', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const campaigns = await prisma.campaign.findMany({
      where: user?.role === UserRole.BRAND ? { brand: { userId: user.userId } } : { status: CampaignStatus.ACTIVE },
      include: {
        brand: {
          select: {
            companyName: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return c.json(campaigns);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    throw new HTTPException(500, { message: `Failed to fetch campaigns: ${error.message}` });
  }
});

// GET a single campaign by ID
campaignRoutes.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const user = c.get('user');

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            userId: true,
            companyName: true,
            industry: true,
            logoUrl: true,
            contactInfo: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new HTTPException(404, { message: 'Campaign not found.' });
    }

    // Ensure brands can only view their own campaigns, influencers can view active campaigns
    if (user?.role === UserRole.BRAND && campaign.brand?.userId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden: You can only view your own campaigns.' });
    }
    if (user?.role === UserRole.INFLUENCER && campaign.status !== CampaignStatus.ACTIVE) {
        throw new HTTPException(403, { message: 'Forbidden: Influencers can only view active campaigns.' });
    }


    return c.json(campaign);
  } catch (error: any) {
    console.error(`Error fetching campaign ${id}:`, error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: `Failed to fetch campaign: ${error.message}` });
  }
});

// POST a new campaign (Brand only)
campaignRoutes.post('/', authMiddleware, roleMiddleware([UserRole.BRAND]), zValidator('json', campaignCreateSchema), async (c) => {
  const data = c.req.valid('json');
  const user = c.get('user');

  try {
    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: user!.userId },
    });

    if (!brandProfile) {
      throw new HTTPException(403, { message: 'Brand profile not found for this user.' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        brandId: brandProfile.id,
        status: CampaignStatus.DRAFT, // New campaigns start as DRAFT
      },
    });
    return c.json(campaign, 201);
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: `Failed to create campaign: ${error.message}` });
  }
});

// PUT update an existing campaign (Brand only)
campaignRoutes.put('/:id', authMiddleware, roleMiddleware([UserRole.BRAND]), zValidator('json', campaignUpdateSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid('json');
  const user = c.get('user');

  try {
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      include: { brand: true },
    });

    if (!existingCampaign) {
      throw new HTTPException(404, { message: 'Campaign not found.' });
    }
    if (existingCampaign.brand?.userId !== user!.userId) {
      throw new HTTPException(403, { message: 'Forbidden: You can only update your own campaigns.' });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data,
    });
    return c.json(updatedCampaign);
  } catch (error: any) {
    console.error(`Error updating campaign ${id}:`, error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: `Failed to update campaign: ${error.message}` });
  }
});

// DELETE a campaign (Brand only)
campaignRoutes.delete('/:id', authMiddleware, roleMiddleware([UserRole.BRAND]), async (c) => {
  const { id } = c.req.param();
  const user = c.get('user');

  try {
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      include: { brand: true },
    });

    if (!existingCampaign) {
      throw new HTTPException(404, { message: 'Campaign not found.' });
    }
    if (existingCampaign.brand?.userId !== user!.userId) {
      throw new HTTPException(403, { message: 'Forbidden: You can only delete your own campaigns.' });
    }

    await prisma.campaign.delete({
      where: { id },
    });
    return c.json({ message: 'Campaign deleted successfully.' }, 204);
  } catch (error: any) {
    console.error(`Error deleting campaign ${id}:`, error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: `Failed to delete campaign: ${error.message}` });
  }
});

export default campaignRoutes;
===ENDFILE===
===FILE: prisma/schema.prisma===
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum UserRole {
  BRAND
  INFLUENCER
  ADMIN
}

enum SocialMediaPlatform {
  INSTAGRAM
  TIKTOK
  YOUTUBE
  FACEBOOK
}

enum CampaignStatus {
  DRAFT       // Campaign is being created, not yet visible or open for applications
  ACTIVE      // Campaign is live, accepting applications or in progress
  COMPLETED   // Campaign tasks finished, payments processed
  CANCELLED   // Campaign was cancelled by brand
}

enum ApplicationStatus {
  PENDING     // Influencer applied, waiting for brand review
  ACCEPTED    // Brand accepted influencer for campaign
  REJECTED    // Brand rejected influencer for campaign
  WITHDRAWN   // Influencer withdrew application
}

// Core Models
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         UserRole
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  brandProfile       BrandProfile?
  influencerProfile  InfluencerProfile?

  @@index([email])
  @@index([role])
}

model BrandProfile {
  id            String  @id @default(uuid())
  userId        String  @unique
  user          User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  companyName   String?
  industry      String?
  logoUrl       String?
  targetAudience Json?   // Store as JSON object or specific fields later
  contactInfo   String?
  brandGuidelines String? @db.Text // Store URL or text, can be long

  campaigns     Campaign[]

  @@index([userId])
}

model InfluencerProfile {
  id                  String   @id @default(uuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  bio                 String?  @db.Text
  expertise           String?
  niches              String[] @default([]) // Array of strings (e.g., "fitness", "nutrition")
  audienceDemographics Json?   // Store as JSON object
  profilePictureUrl   String?
  paymentInfo         Json?    // Store as encrypted JSON or link to payment service

  socialMediaAccounts SocialMediaAccount[]
  campaignApplications CampaignApplication[]

  @@index([userId])
}

model SocialMediaAccount {
  id                String             @id @default(uuid())
  influencerId      String
  influencer        InfluencerProfile  @relation(fields: [influencerId], references: [id], onDelete: Cascade)

  platform          SocialMediaPlatform
  username          String
  platformUserId    String?             @unique // ID from the social media platform itself
  followers         Int                 @default(0)
  engagementRate    Float               @default(0.0)
  dataLastFetched   DateTime            @default(now())

  @@unique([influencerId, platform]) // An influencer can only have one account per platform
  @@index([influencerId])
  @@index([platform])
}

model Campaign {
  id                String         @id @default(uuid())
  brandId           String
  brand             BrandProfile   @relation(fields: [brandId], references: [id], onDelete: Cascade)

  name              String
  description       String         @db.Text
  objectives        String[]       // e.g., ["Brand Awareness", "Sales"]
  targetAudience    Json           // { age: "18-35", gender: "Female", interests: ["Yoga", "Veganism"], location: "Bangkok" }
  influencerCriteria Json          // { niche: "Fitness Trainer", followerCountRange: "10k-50k", engagementRateRange: "3-5%" }
  budget            Json           // { amount: 50000, currency: "THB", model: "FIXED_FEE" }
  deliverables      String[]       // e.g., ["1 Instagram Post", "3 Instagram Stories"]
  kpis              String[]       // e.g., ["Reach", "Engagement Rate", "Conversion Rate"]
  timelineStart     DateTime?
  timelineEnd       DateTime?
  status            CampaignStatus @default(DRAFT)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  applications      CampaignApplication[]

  @@index([brandId])
  @@index([status])
  @@index([timelineStart])
}

model CampaignApplication {
  id              String             @id @default(uuid())
  campaignId      String
  campaign        Campaign           @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  influencerId    String
  influencer      InfluencerProfile  @relation(fields: [influencerId], references: [id], onDelete: Cascade)

  status          ApplicationStatus  @default(PENDING)
  message         String?            @db.Text // Influencer's pitch message
  contentDraftUrl String?            // URL to proposed content draft for review
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@unique([campaignId, influencerId]) // An influencer can apply to a campaign only once
  @@index([campaignId])
  @@index([influencerId])
  @@index([status])
}
===ENDFILE===
===FILE: frontend/package.json===
{
  "name": "wellfluence-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.3",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
===ENDFILE===
===FILE: frontend/tsconfig.json===
{
  "compilerOptions": {
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
===ENDFILE===
===FILE: frontend/next.config.js===
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Add any specific Next.js configurations here.
    // For example, image optimization domains:
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'via.placeholder.com',
        },
        // Add other image domains as needed for logos, profile pictures etc.
      ],
    },
};

module.exports = nextConfig;
===ENDFILE===
===FILE: frontend/tailwind.config.js===
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Blue-500
        secondary: '#10B981', // Emerald-500
        accent: '#F97316', // Orange-500
        dark: '#1F2937', // Gray-800
        light: '#F3F4F6', // Gray-100
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
===ENDFILE===
===FILE: frontend/postcss.config.js===
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
===ENDFILE===
===FILE: frontend/app/globals.css===
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  scroll-behavior: smooth;
}

body {
  @apply bg-light text-dark font-sans antialiased;
}

h1, h2, h3, h4, h5, h6 {
  @apply font-bold;
}
===ENDFILE===
===FILE: frontend/app/layout.tsx===
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wellfluence - Health & Wellness Influencer Marketing',
  description: 'Connect health and wellness brands with trusted influencers. Find your perfect match for impactful campaigns.',
  keywords: ['health', 'wellness', 'influencer marketing', 'B2B2C', 'fitness', 'nutrition', 'mental health', 'marketing platform'],
  openGraph: {
    title: 'Wellfluence - Health & Wellness Influencer Marketing',
    description: 'Connect health and wellness brands with trusted influencers. Find your perfect match for impactful campaigns.',
    url: 'https://www.wellfluence.com', // Replace with actual domain
    siteName: 'Wellfluence',
    images: [
      {
        url: 'https://www.wellfluence.com/og-image.jpg', // Replace with an actual OG image
        width: 1200,
        height: 630,
        alt: 'Wellfluence Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wellfluence - Health & Wellness Influencer Marketing',
    description: 'Connect health and wellness brands with trusted influencers. Find your perfect match for impactful campaigns.',
    creator: '@wellfluence', // Replace with actual Twitter handle if exists
    images: ['https://www.wellfluence.com/twitter-image.jpg'], // Replace with an actual Twitter image
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
===ENDFILE===
===FILE: frontend/app/page.tsx===
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar (simple for Sprint 1) */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center fixed w-full z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            Wellfluence
          </Link>
          <div className="space-x-4">
            <Link href="/login" className="text-dark hover:text-primary">
              Login
            </Link>
            <Link
              href="/register"
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition duration-300"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-secondary text-white py-20 md:py-32 text-center relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 0v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 20h44v2H2v-2zm-2 4h44v2H0v-2zm-2 4h44v2H-2v-2zm-2 4h44v2H-4v-2zm-2 4h44v2H-6v-2zm-2 4h44v2H-8v-2zm-2 4h44v2H-10v-2zm-2 4h44v2H-12v-2zm-2 4h44v2H-14v-2zm-2 4h44v2H-16v-2zm-2 4h44v2H-18v-2zm-2 4h44v2H-20v-2zm-2 4h44v2H-22v-2zm-2 4h44v2H-24v-2zm-2 4h44v2H-26v-2zm-2 4h44v2H-28v-2zm-2 4h44v2H-30v-2zm-2 4h44v2H-32v-2zm-2 4h44v2H-34v-2zm-2 4h44v2H-36v-2zm-2 4h44v2H-38v-2zm-2 4h44v2H-40v-2zm-2 4h44v2H-42v-2zm-2 4h44v2H-44v-2zm-2 4h44v2H-46v-2zm-2 4h44v2H-48v-2zm-2 4h44v2H-50v-2zm-2 4h44v2H-52v-2zm-2 4h44v2H-54v-2zm-2 4h44v2H-56v-2zm-2 4h44v2H-58v-2zm-2 4h44v2H-60v-2zm-2 4h44v2H-62v-2zm-2 4h44v2H-64v-2zM48 20h44v2H48v-2zm-2 4h44v2H46v-2zm-2 4h44v2H44v-2zm-2 4h44v2H42v-2zm-2 4h44v2H40v-2zm-2 4h44v2H38v-2zm-2 4h44v2H36v-2zm-2 4h44v2H34v-2zm-2 4h44v2H32v-2zm-2 4h44v2H30v-2zm-2 4h44v2H28v-2zm-2 4h44v2H26v-2zm-2 4h44v2H24v-2zm-2 4h44v2H22v-2zm-2 4h44v2H20v-2zm-2 4h44v2H18v-2zm-2 4h44v2H16v-2zm-2 4h44v2H14v-2zm-2 4h44v2H12v-2zm-2 4h44v2H10v-2zm-2 4h44v2H8v-2zm-2 4h44v2H6v-2zm-2 4h44v2H4v-2zm-2 4h44v2H2v-2zm-2 4h44v2H0v-2zm-2 4h44v2H-2v-2zM50 20h44v2H50v-2zm-2 4h44v2H48v-2zm-2 4h44v2H46v-2zm-2 4h44v2H44v-2zm-2 4h44v2H42v-2zm-2 4h44v2H40v-2zm-2 4h44v2H38v-2zm-2 4h44v2H36v-2zm-2 4h44v2H34v-2zm-2 4h44v2H32v-2zm-2 4h44v2H30v-2zm-2 4h44v2H28v-2zm-2 4h44v2H26v-2zm-2 4h44v2H24v-2zm-2 4h44v2H22v-2zm-2 4h44v2H20v-2zm-2 4h44v2H18v-2zm-2 4h44v2H16v-2zm-2 4h44v2H14v-2zm-2 4h44v2H12v-2zm-2 4h44v2H10v-2zm-2 4h44v2H8v-2zm-2 4h44v2H6v-2zm-2 4h44v2H4v-2zm-2 4h44v2H2v-2zM52 20h44v2H52v-2zm-2 4h44v2H50v-2zm-2 4h44v2H48v-2zm-2 4h44v2H46v-2zm-2 4h44v2H44v-2zm-2 4h44v2H42v-2zm-2 4h44v2H40v-2zm-2 4h44v2H38v-2zm-2 4h44v2H36v-2zm-2 4h44v2H34v-2zm-2 4h44v2H32v-2zm-2 4h44v2H30v-2zm-2 4h44v2H28v-2zm-2 4h44v2H26v-2zm-2 4h44v2H24v-2zm-2 4h44v2H22v-2zm-2 4h44v2H20v-2zm-2 4h44v2H18v-2zm-2 4h44v2H16v-2zm-2 4h44v2H14v-2zm-2 4h44v2H12v-2zm-2 4h44v2H10v-2zm-2 4h44v2H8v-2zm-2 4h44v2H6v-2zm-2 4h44v2H4v-2zM54 20h44v2H54v-2zm-2 4h44v2H52v-2zm-2 4h44v2H50v-2zm-2 4h44v2H48v-2zm-2 4h44v2H46v-2zm-2 4h44v2H44v-2zm-2 4h44v2H42v-2zm-2 4h44v2H40v-2zm-2 4h44v2H38v-2zm-2 4h44v2H36v-2zm-2 4h44v2H34v-2zm-2 4h44v2H32v-2zm-2 4h44v2H30v-2zm-2 4h44v2H28v-2zm-2 4h44v2H26v-2zm-2 4h44v2H24v-2zm-2 4h44v2H22v-2zm-2 4h44v2H20v-2zm-2 4h44v2H18v-2zm-2 4h44v2H16v-2zm-2 4h44v2H14v-2zm-2 4h44v2H12v-2zm-2 4h44v2H10v-2zm-2 4h44v2H8v-2zM56 20h44v2H56v-2zm-2 4h44v2H54v-2zm-2 4h44v2H52v-2zm-2 4h44v2H50v-2zm-2 4h44v2H48v-2zm-2 4h44v2H46v-2zm-2 4h44v2H44v-2zm-2 4h44v2H42v-2zm-2 4h44v2H40v-2zm-2 4h44v2H38v-2zm-2 4h44v2H36v-2zm-2 4h44v2H34v-2zm-2 4h44v2H32v-2zm-2 4h44v2H30v-2zm-2 4h44v2H28v-2zm-2 4h44v2H26v-2zm-2 4h44v2H24v-2zm-2 4h44v2H22v-2zm-2 4h44v2H20v-2zm-2 4h44v2H18v-2zm-2 4h44v2H16v-2zm-2 4h44v2H14v-2zm-2 4h44v2H12v-2zM58 20h44v2H58v-2zm-2 4h44v2H56v-2zm-2 4h44v2H54v-2zm-2 4h44v2H52v-2zm-2 4h44v2H50v-2zm-2 4h44v2H48v-2zm-2 4h44v2H46v-2zm-2 4h44v2H44v-2zm-2 4h44v2H42v-2zm-2 4h44v2H40v-2zm-2 4h44v2H38v-2zm-2 4h44v2H36v-2zm-2 4h44v2H34v-2zm-2 4h44v2H32v-2zm-2 4h44v2H30v-2zm-2 4h44v2H28v-2zm-2 4h44v2H26v-2zm-2 4h44v2H24v-2zm-2 4h44v2H22v-2zm-2 4h44v2H20v-2zM0 0v18h2V0H0zm4 0v18h2V0H4zm4 0v18h2V0H8zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zM0 48v12h2V48H0zm4 0v12h2V48H4zm4 0v12h2V48H8zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zM0 60v-2h2v2H0zm4 0v-2h2v2H4zm4 0v-2h2v2H8zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zM48 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zM48 48v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zM48 60v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zM50 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zM50 48v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zM50 60v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zM52 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zM52 48v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zM52 60v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zM54 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zM54 48v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zM54 60v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zM56 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zM56 48v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zM56 60v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zM58 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zm4 0v18h2V0h-2zM58 48v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zm4 0v12h2V48h-2zM58 60v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2z\' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Wellfluence: Connect. Influence. Thrive.
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              The premier B2B2C platform connecting health & wellness brands with authentic, impactful influencers.
            </p>
            <div className="space-x-4">
              <Link
                href="/register"
                className="bg-accent text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 transition duration-300 shadow-lg"
              >
                Join as Brand
              </Link>
              <Link
                href="/register"
                className="bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition duration-300 shadow-lg"
              >
                Join as Influencer
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-dark mb-12">
              Transforming Health & Wellness Marketing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {/* Feature 1 */}
              <div className="bg-light p-8 rounded-lg shadow-md hover:shadow-xl transition duration-300">
                <div className="text-primary text-5xl mb-4">💪</div>
                <h3 className="text-xl font-bold mb-3 text-dark">Targeted Connections</h3>
                <p className="text-gray-700">
                  Brands easily find credible influencers in specific health niches. Influencers connect with quality brands aligned with their values.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-light p-8 rounded-lg shadow-md hover:shadow-xl transition duration-300">
                <div className="text-secondary text-5xl mb-4">📈</div>
                <h3 className="text-xl font-bold mb-3 text-dark">Measurable Impact</h3>
                <p className="text-gray-700">
                  Track campaign performance with real-time analytics and clear KPIs to ensure optimal ROI for brands and fair compensation for influencers.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-light p-8 rounded-lg shadow-md hover:shadow-xl transition duration-300">
                <div className="text-accent text-5xl mb-4">🤝</div>
                <h3 className="text-xl font-bold mb-3 text-dark">Transparent Collaboration</h3>
                <p className="text-gray-700">
                  Streamlined tools for brief sharing, content approval, and secure payments via our integrated escrow system.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-primary py-20 text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">Ready to Join Wellfluence?</h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto">
              Whether you're a brand seeking authentic reach or an influencer looking for meaningful collaborations, Wellfluence is your platform.
            </p>
            <Link
              href="/register"
              className="bg-accent text-white px-10 py-5 rounded-lg text-xl font-semibold hover:bg-orange-600 transition duration-300 shadow-lg"
            >
              Get Started Now
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold mb-4">Wellfluence</p>
          <p className="text-gray-400">&copy; {new Date().getFullYear()} Wellfluence. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link>
            <Link href="#" className="text-gray-400 hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
===ENDFILE===
===FILE: frontend/app/(auth)/login/page.tsx===
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.user.role); // Store user role
      router.push('/'); // Redirect to home or dashboard after login
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-light px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-dark">
            Login to Wellfluence
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-primary hover:text-primary-dark">
              register for a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-primary hover:text-primary-dark">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
===ENDFILE===
===FILE: frontend/app/(auth)/register/page.tsx===
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'BRAND' | 'INFLUENCER'>('INFLUENCER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', { email, password, role });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.user.role); // Store user role
      router.push('/'); // Redirect to home or dashboard after registration
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-light px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-dark">
            Create your Wellfluence account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
              login to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center">
            <label htmlFor="role" className="mr-3 block text-sm font-medium text-gray-700">
              Register as:
            </label>
            <select
              id="role"
              name="role"
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              value={role}
              onChange={(e) => setRole(e.target.value as 'BRAND' | 'INFLUENCER')}
            >
              <option value="INFLUENCER">Influencer</option>
              <option value="BRAND">Brand</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
===ENDFILE===
===FILE: frontend/lib/api.ts===
import axios from 'axios';

// Get backend URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to outgoing requests
api.interceptors.request.use(
  (config) => {
    // Check if the code is running on the client-side (browser)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
===ENDFILE===