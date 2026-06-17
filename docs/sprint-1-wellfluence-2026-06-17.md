# Sprint 1: Wellfluence

> Goal: Foundation — Prisma schema + Hono.js API + Next.js landing page
> Date: 2026-06-17

---

## Sprint Summary

✅ ฟีเจอร์ที่สร้างเสร็จแล้ว (Features Implemented)
• การตั้งค่าโปรเจกต์พื้นฐานสำหรับ Backend ด้วย Hono.js และ Prisma (Basic project setup for Backend with Hono.js and Prisma)
• การตั้งค่าโปรเจกต์พื้นฐานสำหรับ Frontend ด้วย Next.js และ Tailwind CSS (Basic project setup for Frontend with Next.js and Tailwind CSS

---

## Code

===FILE: backend/package.json===
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node build/index.js",
    "prisma:migrate": "prisma migrate dev --name init",
    "prisma:generate": "prisma generate"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@hono/zod-validator": "^0.2.2",
    "@prisma/client": "^5.12.1",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "hono": "^4.2.3",
    "jose": "^5.2.4",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.12.7",
    "prisma": "^5.12.1",
    "tsx": "^4.7.2",
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
    "outDir": "build",
    "rootDir": "src"
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
===ENDFILE===

===FILE: backend/.env.example===
DATABASE_URL="postgresql://user:password@localhost:5432/wellfluence_db?schema=public"
JWT_SECRET="YOUR_SUPER_SECRET_JWT_KEY_HERE"
PORT=8000
FRONTEND_URL="http://localhost:3000"
===ENDFILE===

===FILE: backend/src/index.ts===
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
===ENDFILE===

===FILE: backend/src/lib/prisma.ts===
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __db__: PrismaClient;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
}

export { prisma };
===ENDFILE===

===FILE: backend/src/lib/auth.ts===
import * as jose from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_ALGORITHM = 'HS256';

export async function signJwt(payload: object, expiresIn: string = '24h'): Promise<string> {
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
  return jwt;
}

export async function verifyJwt<T>(token: string): Promise<T> {
  const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
  });
  return payload as T;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
===ENDFILE===

===FILE: backend/src/middleware/auth.middleware.ts===
import { createMiddleware } from 'hono/factory';
import { verifyJwt } from '../lib/auth';
import { Prisma, UserType } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  userType: UserType;
  iat: number;
  exp: number;
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized: No token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyJwt<JwtPayload>(token);
    c.set('jwtPayload', payload);
    await next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return c.json({ message: 'Unauthorized: Invalid token' }, 401);
  }
});

export const authorizeRoles = (allowedRoles: UserType[]) =>
  createMiddleware(async (c, next) => {
    const jwtPayload = c.get('jwtPayload') as JwtPayload;

    if (!jwtPayload || !allowedRoles.includes(jwtPayload.userType)) {
      return c.json({ message: 'Forbidden: Insufficient permissions' }, 403);
    }

    await next();
  });
===ENDFILE===

===FILE: backend/src/routes/auth.route.ts===
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword, signJwt } from '../lib/auth';
import { authMiddleware, JwtPayload } from '../middleware/auth.middleware';
import { UserType } from '@prisma/client';

const authRouter = new Hono();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  userType: z.enum([UserType.BRAND, UserType.INFLUENCER], {
    errorMap: () => ({ message: 'Invalid user type. Must be BRAND or INFLUENCER.' }),
  }),
});

authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, userType } = c.req.valid('json');

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return c.json({ message: 'User with this email already exists' }, 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      userType,
    },
    select: {
      id: true,
      email: true,
      userType: true,
      createdAt: true,
    },
  });

  const token = await signJwt({ userId: user.id, email: user.email, userType: user.userType });

  return c.json({ user, token }, 201);
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password cannot be empty'),
});

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return c.json({ message: 'Invalid credentials' }, 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return c.json({ message: 'Invalid credentials' }, 401);
  }

  const token = await signJwt({ userId: user.id, email: user.email, userType: user.userType });

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      userType: user.userType,
    },
    token,
  });
});

authRouter.get('/profile', authMiddleware, async (c) => {
  const jwtPayload = c.get('jwtPayload') as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: jwtPayload.userId },
    select: {
      id: true,
      email: true,
      userType: true,
      createdAt: true,
      brandProfile: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
      influencerProfile: {
        select: {
          id: true,
          bio: true,
          expertiseCategories: true,
        },
      },
    },
  });

  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  return c.json(user);
});

export { authRouter };
===ENDFILE===

===FILE: backend/src/routes/campaign.route.ts===
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../lib/prisma';
import { authMiddleware, authorizeRoles, JwtPayload } from '../middleware/auth.middleware';
import { CampaignStatus, UserType } from '@prisma/client';

const campaignRouter = new Hono();

const campaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  budget: z.number().positive('Budget must be a positive number'),
  objectives: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  contentRequirements: z.string().optional(),
  type: z.string().optional(),
  status: z.nativeEnum(CampaignStatus).optional().default(CampaignStatus.DRAFT),
});

// Create Campaign - Only Brand users
campaignRouter.post('/', authMiddleware, authorizeRoles([UserType.BRAND]), zValidator('json', campaignSchema), async (c) => {
  const { userId } = c.get('jwtPayload') as JwtPayload;
  const data = c.req.valid('json');

  const brandProfile = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brandProfile) {
    return c.json({ message: 'Brand profile not found for this user.' }, 404);
  }

  const campaign = await prisma.campaign.create({
    data: {
      ...data,
      brandId: brandProfile.id,
    },
  });

  return c.json(campaign, 201);
});

// Get all campaigns - Accessible to all authenticated users (or public for discovery)
campaignRouter.get('/', authMiddleware, async (c) => {
  const campaigns = await prisma.campaign.findMany({
    include: {
      brand: {
        select: {
          name: true,
          logoUrl: true,
        },
      },
    },
    where: {
      status: {
        in: [CampaignStatus.ACTIVE, CampaignStatus.PENDING_APPROVAL], // Only show relevant campaigns
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return c.json(campaigns);
});

// Get a single campaign by ID
campaignRouter.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      brand: {
        select: {
          name: true,
          logoUrl: true,
          companyInfo: true,
          businessType: true,
        },
      },
    },
  });

  if (!campaign) {
    return c.json({ message: 'Campaign not found' }, 404);
  }
  return c.json(campaign);
});

// Update Campaign - Only Brand users who own the campaign
campaignRouter.put('/:id', authMiddleware, authorizeRoles([UserType.BRAND]), zValidator('json', campaignSchema.partial()), async (c) => {
  const { id } = c.req.param();
  const { userId } = c.get('jwtPayload') as JwtPayload;
  const data = c.req.valid('json');

  const brandProfile = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brandProfile) {
    return c.json({ message: 'Brand profile not found for this user.' }, 404);
  }

  const existingCampaign = await prisma.campaign.findUnique({ where: { id } });
  if (!existingCampaign) {
    return c.json({ message: 'Campaign not found' }, 404);
  }
  if (existingCampaign.brandId !== brandProfile.id) {
    return c.json({ message: 'Forbidden: You do not own this campaign' }, 403);
  }

  const updatedCampaign = await prisma.campaign.update({
    where: { id },
    data,
  });

  return c.json(updatedCampaign);
});

// Delete Campaign - Only Brand users who own the campaign
campaignRouter.delete('/:id', authMiddleware, authorizeRoles([UserType.BRAND]), async (c) => {
  const { id } = c.req.param();
  const { userId } = c.get('jwtPayload') as JwtPayload;

  const brandProfile = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brandProfile) {
    return c.json({ message: 'Brand profile not found for this user.' }, 404);
  }

  const existingCampaign = await prisma.campaign.findUnique({ where: { id } });
  if (!existingCampaign) {
    return c.json({ message: 'Campaign not found' }, 404);
  }
  if (existingCampaign.brandId !== brandProfile.id) {
    return c.json({ message: 'Forbidden: You do not own this campaign' }, 403);
  }

  await prisma.campaign.delete({ where: { id } });

  return c.json({ message: 'Campaign deleted successfully' }, 200);
});

export { campaignRouter };
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

enum UserType {
  BRAND
  INFLUENCER
  ADMIN
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PENDING_APPROVAL
  COMPLETED
  CANCELLED
}

model User {
  id               String            @id @default(uuid())
  email            String            @unique
  passwordHash     String
  userType         UserType
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  brandProfile     BrandProfile?
  influencerProfile InfluencerProfile?

  @@index([email])
  @@map("users")
}

model BrandProfile {
  id            String     @id @default(uuid())
  name          String
  logoUrl       String?
  companyInfo   String?
  businessType  String? // e.g., Supplements, Cosmetics, Fitness
  userId        String     @unique
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaigns     Campaign[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([userId])
  @@map("brand_profiles")
}

model InfluencerProfile {
  id                   String    @id @default(uuid())
  bio                  String?
  expertiseCategories  String[]  @default([]) // e.g., ["Fitness", "Skincare", "Nutrition"]
  socialMediaStats     Json?     // Store JSON blob of followers, engagement, etc.
  userId               String    @unique
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolioItems       PortfolioItem[]
  campaignApplications CampaignApplication[] // Influencer's applications to campaigns
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  @@index([userId])
  @@map("influencer_profiles")
}

model Campaign {
  id                  String           @id @default(uuid())
  title               String
  description         String
  budget              Float
  type                String?          // e.g., Product Review, Brand Ambassador
  objectives          String[]         @default([]) // e.g., ["Brand Awareness", "Sales Conversion"]
  targetAudience      String?          // e.g., "Women aged 25-35 interested in organic products"
  contentRequirements String?          // Detailed requirements for content
  status              CampaignStatus   @default(ACTIVE)
  brandId             String
  brand               BrandProfile     @relation(fields: [brandId], references: [id], onDelete: Cascade)
  campaignApplications CampaignApplication[] // Applications for this campaign
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  @@index([brandId])
  @@index([status])
  @@map("campaigns")
}

model CampaignApplication {
  id                String    @id @default(uuid())
  campaignId        String
  campaign          Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  influencerId      String
  influencer        InfluencerProfile @relation(fields: [influencerId], references: [id], onDelete: Cascade)
  status            String    @default("PENDING") // PENDING, ACCEPTED, REJECTED, CONTENT_SUBMITTED, CONTENT_APPROVED
  proposalMessage   String?
  proposedRate      Float?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([campaignId, influencerId]) // An influencer can only apply to a campaign once
  @@index([campaignId])
  @@index([influencerId])
  @@map("campaign_applications")
}

model PortfolioItem {
  id             String    @id @default(uuid())
  influencerId   String
  influencer     InfluencerProfile @relation(fields: [influencerId], references: [id], onDelete: Cascade)
  title          String
  description    String?
  mediaUrls      String[]  @default([]) // URLs to images/videos hosted on S3
  externalLink   String?   // Link to original social media post
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([influencerId])
  @@map("portfolio_items")
}

// Future models (beyond Sprint 1 scope but good to think about)
// model PaymentTransaction { ... }
// model Notification { ... }
// model Message { ... }
// model DigitalContract { ... }
===ENDFILE===

===FILE: frontend/package.json===
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "axios": "^1.6.8",
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      // Add other image domains if needed, e.g., AWS S3 bucket
    ],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
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
        primary: '#4F46E5', // Indigo
        secondary: '#10B981', // Emerald
        accent: '#FBBF24', // Amber
        background: '#F9FAFB', // Light Gray
        text: '#1F2937', // Dark Gray
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
===ENDFILE===

===FILE: frontend/postcss.config.js===
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
===ENDFILE===

===FILE: frontend/app/globals.css===
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  padding: 0;
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Open Sans',
    'Helvetica Neue',
    sans-serif;
  @apply text-text bg-background;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  @apply font-bold text-text;
}

.btn-primary {
  @apply px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-indigo-700 transition-colors duration-200;
}

.btn-secondary {
  @apply px-6 py-3 rounded-lg bg-transparent border border-primary text-primary font-medium hover:bg-indigo-50 transition-colors duration-200;
}
===ENDFILE===

===FILE: frontend/app/layout.tsx===
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wellfluence - Health & Wellness Influencer Platform',
  description: 'Connects Health & Wellness brands with specialized influencers for effective promotion.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
===ENDFILE===

===FILE: frontend/app/page.tsx===
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md py-4 px-6 md:px-12 flex justify-between items-center fixed w-full z-10">
        <div className="text-2xl font-bold text-primary">Wellfluence</div>
        <div className="space-x-4">
          <Link href="/login" className="text-text hover:text-primary transition-colors">Login</Link>
          <Link href="/register" className="btn-primary">Register</Link>
        </div>
      </nav>

      <main className="flex-grow pt-20"> {/* Add padding-top to account for fixed nav */}
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-indigo-600 text-white py-20 px-6 md:px-12 text-center flex flex-col items-center justify-center min-h-[500px]">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Amplify Your Health & Wellness Brand
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl">
            Wellfluence connects top Health & Wellness brands with authentic, niche influencers for unparalleled reach and impact.
          </p>
          <div className="space-x-4">
            <Link href="/register" className="btn-primary bg-secondary hover:bg-emerald-600">
              Get Started for Free
            </Link>
            <Link href="/login" className="btn-secondary text-white border-white hover:bg-white hover:text-primary">
              Learn More
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-6 md:px-12 bg-gray-50">
          <h2 className="text-4xl font-bold text-center mb-12 text-primary">Why Wellfluence?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl text-accent mb-4">✨</div>
              <h3 className="text-2xl font-semibold mb-4">Targeted Discovery</h3>
              <p className="text-lg text-gray-700">
                Find the perfect Health & Wellness influencers with advanced filters and AI matching.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl text-secondary mb-4">📈</div>
              <h3 className="text-2xl font-semibold mb-4">Seamless Campaigns</h3>
              <p className="text-lg text-gray-700">
                Manage campaigns from creation to payment with intuitive tools and real-time tracking.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl text-primary mb-4">🔒</div>
              <h3 className="text-2xl font-semibold mb-4">Secure & Transparent</h3>
              <p className="text-lg text-gray-700">
                Benefit from escrow payments and clear analytics for measurable ROI.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-primary text-white py-16 px-6 md:px-12 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Elevate Your Influence or Brand?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join Wellfluence today and be part of the leading platform for Health & Wellness collaborations.
          </p>
          <Link href="/register" className="btn-primary bg-accent hover:bg-amber-400">
            Sign Up Now
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 px-6 md:px-12 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="text-2xl font-bold text-white mb-4 md:mb-0">Wellfluence</div>
            <div className="flex space-x-6">
              <Link href="#" className="hover:text-white transition-colors">About Us</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Wellfluence. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
===ENDFILE===

===FILE: frontend/app/(auth)/login/page.tsx===
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user)); // Store user info
      router.push('/'); // Redirect to homepage or dashboard after login
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-center">{error}</p>}
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

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <Link href="/register" className="font-medium text-primary hover:text-indigo-500">
            Don't have an account? Register
          </Link>
        </div>
      </div>
    </div>
  );
}
===ENDFILE===

===FILE: frontend/app/(auth)/register/page.tsx===
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('BRAND'); // Default to Brand
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', { email, password, userType });
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      router.push('/'); // Redirect to homepage or dashboard after registration
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text">
            Create your Wellfluence account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-center">{error}</p>}
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
            <div className="mt-4">
              <label htmlFor="user-type" className="sr-only">
                Account Type
              </label>
              <select
                id="user-type"
                name="user-type"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="BRAND">Brand</option>
                <option value="INFLUENCER">Influencer</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <Link href="/login" className="font-medium text-primary hover:text-indigo-500">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
===ENDFILE===

===FILE: frontend/lib/api.ts===
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
===ENDFILE===