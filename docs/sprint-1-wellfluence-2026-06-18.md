# Sprint 1: Wellfluence

> Goal: Foundation — Prisma schema + Hono.js API + Next.js landing page
> Date: 2026-06-18

---

## Sprint Summary

✅ ฟีเจอร์ที่สร้างเสร็จแล้ว / Features Implemented
• ระบบการจัดการผู้ใช้งาน (การลงทะเบียนและการเข้าสู่ระบบ) พร้อมการยืนยันตัวตนด้วย JWT (User management system (registration and login) with JWT authentication)
• ระบบการตรวจสอบสิทธิ์ผู้ใช้งานตามบทบาท (Role-based authorization for user access)
• API สำหรับจัดการโปรไฟล์

---

## Code

===FILE: backend/package.json===
{
  "name": "wellfluence-backend",
  "version": "1.0.0",
  "description": "Backend for Wellfluence, a Health & Wellness Influencer Marketing Platform",
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:migrate": "prisma migrate dev --name init",
    "prisma:generate": "prisma generate"
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
    "tsx": "^4.10.2",
    "typescript": "^5.4.5"
  }
}
===ENDFILE===

===FILE: backend/tsconfig.json===
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "*": ["node_modules/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
===ENDFILE===

===FILE: backend/.env.example===
DATABASE_URL="postgresql://user:password@localhost:5432/wellfluence?schema=public"
JWT_SECRET="YOUR_SUPER_STRONG_SECRET_KEY_HERE_MIN_32_CHARS"
PORT=8000
FRONTEND_URL="http://localhost:3000"
===ENDFILE===

===FILE: backend/src/index.ts===
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import 'dotenv/config';

import { authRouter } from './routes/auth.route';
import { influencerRouter } from './routes/influencer.route';

const app = new Hono();

// Middleware
app.use(logger());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

export default {
  port,
  fetch: app.fetch,
};
===ENDFILE===

===FILE: backend/src/lib/prisma.ts===
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of PrismaClient in development
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export default prisma;
===ENDFILE===

===FILE: backend/src/lib/auth.ts===
import { SignJWT, jwtVerify } from 'jose';
import { HonoContext } from '../types/hono';
import { HTTPException } from 'hono/http-exception';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const signJwt = async (payload: object, expiresIn: string = '1d'): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
};

export const verifyJwt = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid or expired token.' });
  }
};

export const decodeJwt = async (c: HonoContext) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];
  return await verifyJwt(token);
};
===ENDFILE===

===FILE: backend/src/middleware/auth.middleware.ts===
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
===ENDFILE===

===FILE: backend/src/routes/auth.route.ts===
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
===ENDFILE===

===FILE: backend/src/routes/influencer.route.ts===
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../lib/prisma';
import { authMiddleware, authorizeRole } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

export const influencerRouter = new Hono();

const influencerProfileSchema = z.object({
  bio: z.string().min(10, 'Bio must be at least 10 characters long.').max(500, 'Bio cannot exceed 500 characters.'),
  niche: z.array(z.string()).min(1, 'At least one niche is required.'),
  audienceDemographics: z.object({
    ageRange: z.string().optional(),
    gender: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
  mediaKitUrl: z.string().url('Invalid URL format.').optional().nullable(),
  socialMediaLinks: z.array(z.object({
    platform: z.enum(['INSTAGRAM', 'TIKTOK', 'YOUTUBE']),
    username: z.string().min(1),
    profileUrl: z.string().url().optional(),
    isVerified: z.boolean().default(false),
  })).optional(),
  followerCount: z.number().int().min(0).optional(),
  engagementRate: z.number().min(0).max(100).optional(),
});

// GET all influencer profiles (for Brands/Admins to discover)
influencerRouter.get('/', authMiddleware, authorizeRole([UserRole.BRAND, UserRole.ADMIN]), async (c) => {
  const influencers = await prisma.influencerProfile.findMany({
    include: {
      user: {
        select: {
          email: true,
        },
      },
      socialMediaAccounts: true,
    },
  });
  return c.json({ success: true, data: influencers });
});

// GET a specific influencer profile by ID
influencerRouter.get('/:id', authMiddleware, authorizeRole([UserRole.BRAND, UserRole.INFLUENCER, UserRole.ADMIN]), async (c) => {
  const influencerId = c.req.param('id');
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  const influencer = await prisma.influencerProfile.findUnique({
    where: { id: influencerId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      socialMediaAccounts: true,
      _count: {
        select: {
          campaignProposals: true,
        },
      },
    },
  });

  if (!influencer) {
    throw new HTTPException(404, { message: 'Influencer profile not found.' });
  }

  // If the user is an influencer, ensure they can only view their own profile unless they are an admin.
  if (userRole === UserRole.INFLUENCER && influencer.userId !== userId) {
    throw new HTTPException(403, { message: 'Forbidden: You can only view your own profile.' });
  }

  return c.json({ success: true, data: influencer });
});

// CREATE an influencer profile (only an INFLUENCER can create their own)
influencerRouter.post('/', authMiddleware, authorizeRole(UserRole.INFLUENCER), zValidator('json', influencerProfileSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');

  const existingProfile = await prisma.influencerProfile.findUnique({ where: { userId } });
  if (existingProfile) {
    throw new HTTPException(409, { message: 'An influencer profile already exists for this user.' });
  }

  const newProfile = await prisma.influencerProfile.create({
    data: {
      ...data,
      user: { connect: { id: userId } },
      socialMediaAccounts: data.socialMediaLinks ? {
        createMany: {
          data: data.socialMediaLinks.map(link => ({
            platform: link.platform,
            username: link.username,
            profileUrl: link.profileUrl,
            isVerified: link.isVerified,
          })),
        },
      } : undefined,
    },
    include: { socialMediaAccounts: true },
  });

  return c.json({ success: true, message: 'Influencer profile created.', data: newProfile }, 201);
});

// UPDATE an influencer profile (only the INFLUENCER can update their own, or ADMIN)
influencerRouter.put('/:id', authMiddleware, authorizeRole([UserRole.INFLUENCER, UserRole.ADMIN]), zValidator('json', influencerProfileSchema.partial()), async (c) => {
  const influencerId = c.req.param('id');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const data = c.req.valid('json');

  const existingProfile = await prisma.influencerProfile.findUnique({ where: { id: influencerId } });
  if (!existingProfile) {
    throw new HTTPException(404, { message: 'Influencer profile not found.' });
  }

  if (userRole === UserRole.INFLUENCER && existingProfile.userId !== userId) {
    throw new HTTPException(403, { message: 'Forbidden: You can only update your own profile.' });
  }

  const updatedProfile = await prisma.influencerProfile.update({
    where: { id: influencerId },
    data: {
      ...data,
      socialMediaAccounts: data.socialMediaLinks ? {
        deleteMany: {}, // Clear existing social media accounts to re-create
        createMany: {
          data: data.socialMediaLinks.map(link => ({
            platform: link.platform,
            username: link.username,
            profileUrl: link.profileUrl,
            isVerified: link.isVerified,
          })),
        },
      } : undefined,
    },
    include: { socialMediaAccounts: true },
  });

  return c.json({ success: true, message: 'Influencer profile updated.', data: updatedProfile });
});

// DELETE an influencer profile (only ADMIN can delete)
influencerRouter.delete('/:id', authMiddleware, authorizeRole(UserRole.ADMIN), async (c) => {
  const influencerId = c.req.param('id');

  const existingProfile = await prisma.influencerProfile.findUnique({ where: { id: influencerId } });
  if (!existingProfile) {
    throw new HTTPException(404, { message: 'Influencer profile not found.' });
  }

  await prisma.socialMediaAccount.deleteMany({ where: { influencerProfileId: influencerId } });
  await prisma.influencerProfile.delete({ where: { id: influencerId } });

  return c.json({ success: true, message: 'Influencer profile deleted.' });
});
===ENDFILE===

===FILE: backend/src/types/hono.d.ts===
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
===ENDFILE===

===FILE: prisma/schema.prisma===
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
  CUSTOMER
  ADMIN
}

enum SocialPlatform {
  INSTAGRAM
  TIKTOK
  YOUTUBE
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  COMPLETED
  PAUSED
  CANCELLED
}

enum ProposalStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
}

enum ContentApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
}

enum TransactionType {
  COMMISSION
  PAYOUT
  REFUND
  ESCROW
}

// Models
model User {
  id               String            @id @default(uuid())
  email            String            @unique
  passwordHash     String
  role             UserRole
  isVerified       Boolean           @default(false)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  brandProfile     BrandProfile?
  influencerProfile InfluencerProfile?
  customerProfile  CustomerProfile?
  sentTransactions Transaction[]     @relation("SenderTransactions")
  receivedTransactions Transaction[]   @relation("ReceiverTransactions")
}

model BrandProfile {
  id           String      @id @default(uuid())
  userId       String      @unique
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyName  String
  description  String?
  website      String?
  logoUrl      String?
  industry     String?
  contactPerson String?
  contactEmail String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  campaigns    Campaign[]
}

model InfluencerProfile {
  id                 String              @id @default(uuid())
  userId             String              @unique
  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio                String?
  niche              String[]            // e.g., ["Fitness", "Nutrition", "Mental Wellness"]
  audienceDemographics Json?              // Store as JSON for flexibility, e.g., { "ageRange": "18-24", "gender": "Female", "location": "Bangkok" }
  mediaKitUrl        String?
  followerCount      Int?
  engagementRate     Float?             // Percentage, e.g., 5.25
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  socialMediaAccounts SocialMediaAccount[]
  campaignProposals  CampaignProposal[]
  contentApprovals    ContentApproval[]
}

model SocialMediaAccount {
  id                 String          @id @default(uuid())
  influencerProfileId String
  influencerProfile  InfluencerProfile @relation(fields: [influencerProfileId], references: [id], onDelete: Cascade)
  platform           SocialPlatform
  username           String
  profileUrl         String?
  accessToken        String?         // Encrypted access token
  refreshToken       String?         // Encrypted refresh token
  audienceInsights   Json?           // Store social media platform-specific audience insights
  isVerified         Boolean         @default(false)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@unique([influencerProfileId, platform])
  @@index([influencerProfileId])
}

model CustomerProfile {
  id         String   @id @default(uuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  preferences Json?    // e.g., { "interests": ["Fitness", "Healthy Eating"], "productTypes": ["Supplements"] }
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Campaign {
  id              String         @id @default(uuid())
  brandId         String
  brand           BrandProfile   @relation(fields: [brandId], references: [id], onDelete: Cascade)
  name            String
  description     String
  objectives      String[]       // e.g., ["Brand Awareness", "Sales Conversion"]
  budget          Float
  currency        String         @default("THB")
  deliverables    String[]       // e.g., ["1 Instagram Post", "2 Stories"]
  targetAudience  Json?          // e.g., { "ageRange": "25-34", "gender": "Any", "interests": ["Yoga"] }
  productType     String?
  status          CampaignStatus @default(DRAFT)
  startDate       DateTime?
  endDate         DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  campaignProposals CampaignProposal[]
  contentApprovals  ContentApproval[]
  transactions      Transaction[]
}

model CampaignProposal {
  id             String         @id @default(uuid())
  campaignId     String
  campaign       Campaign       @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  influencerId   String
  influencer     InfluencerProfile @relation(fields: [influencerId], references: [id], onDelete: Cascade)
  proposedFee    Float
  message        String?
  status         ProposalStatus @default(PENDING)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@unique([campaignId, influencerId])
  @@index([campaignId])
  @@index([influencerId])
}

model ContentApproval {
  id             String               @id @default(uuid())
  campaignId     String
  campaign       Campaign             @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  influencerId   String
  influencer     InfluencerProfile    @relation(fields: [influencerId], references: [id], onDelete: Cascade)
  contentUrl     String               // URL to the content (e.g., S3 link, draft post link)
  status         ContentApprovalStatus @default(PENDING)
  feedback       String?
  approvalDate   DateTime?
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt

  @@unique([campaignId, influencerId])
  @@index([campaignId])
  @@index([influencerId])
}

model Transaction {
  id          String          @id @default(uuid())
  campaignId  String?
  campaign    Campaign?       @relation(fields: [campaignId], references: [id])
  senderId    String
  sender      User            @relation("SenderTransactions", fields: [senderId], references: [id])
  receiverId  String
  receiver    User            @relation("ReceiverTransactions", fields: [receiverId], references: [id])
  amount      Float
  currency    String          @default("THB")
  status      TransactionStatus @default(PENDING)
  type        TransactionType // e.g., COMMISSION, PAYOUT, ESCROW_DEPOSIT
  description String?
  paymentGatewayId String?    // ID from Stripe/PayPal etc.
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([senderId])
  @@index([receiverId])
  @@index([campaignId])
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
    "axios": "^1.6.8",
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.19",
    "eslint": "^8",
    "eslint-config-next": "14.2.3",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5"
  }
}
===ENDFILE===

===FILE: frontend/tsconfig.json===
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
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
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
===ENDFILE===

===FILE: frontend/next.config.js===
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // For dummy images
      },
      // Add other image hosts as needed for logos, profile pictures etc.
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
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efad',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#0f3a21',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
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

html, body {
  @apply antialiased text-gray-800 bg-gray-50;
  scroll-behavior: smooth;
}
===ENDFILE===

===FILE: frontend/app/layout.tsx===
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wellfluence - Health & Wellness Influencer Marketing Platform',
  description: 'Wellfluence is the premier hub connecting health and wellness brands with credible and influential content creators.',
  keywords: ['health', 'wellness', 'influencer marketing', 'brand', 'influencer', 'fitness', 'nutrition', 'mental health', 'beauty'],
  openGraph: {
    title: 'Wellfluence - Health & Wellness Influencer Marketing Platform',
    description: 'Wellfluence is the premier hub connecting health and wellness brands with credible and influential content creators.',
    url: 'https://www.wellfluence.com', // Replace with actual domain
    siteName: 'Wellfluence',
    images: [
      {
        url: 'https://via.placeholder.com/1200x630/22c55e/ffffff?text=Wellfluence', // Placeholder for OG image
        width: 1200,
        height: 630,
        alt: 'Wellfluence - Health & Wellness Influencer Marketing Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wellfluence - Health & Wellness Influencer Marketing Platform',
    description: 'Wellfluence is the premier hub connecting health and wellness brands with credible and influential content creators.',
    creator: '@wellfluence', // Replace with actual Twitter handle
    images: ['https://via.placeholder.com/1200x675/22c55e/ffffff?text=Wellfluence'], // Placeholder for Twitter image
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
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
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Wellfluence
          </Link>
          <div className="space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-primary-600">Login</Link>
            <Link href="/register" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition duration-300">Register</Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary-600 to-green-400 text-white py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Amplify Your Health & Wellness Brand
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 opacity-90">
              Wellfluence connects leading health and wellness brands with influential content creators to reach engaged audiences and drive authentic growth.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/register?role=BRAND" className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105">
                Join as a Brand
              </Link>
              <Link href="/register?role=INFLUENCER" className="px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-primary-600 transition duration-300 transform hover:scale-105">
                Join as an Influencer
              </Link>
            </div>
          </div>
        </section>

        {/* Features for Brands */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">For Brands: Discover Your Perfect Influencer</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-primary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Targeted Discovery</h3>
                <p className="text-gray-600">Find influencers by niche, audience demographics, and performance metrics, ensuring a perfect match for your campaign.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-primary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Transparent Campaigns</h3>
                <p className="text-gray-600">Manage campaign objectives, budgets, and deliverables with clear communication and content approval workflows.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-primary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Measurable ROI</h3>
                <p className="text-gray-600">Track real-time performance, engagement, and ROI with comprehensive analytics and detailed campaign reports.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features for Influencers */}
        <section className="py-20 bg-primary-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">For Influencers: Monetize Your Influence</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-secondary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 100 4m-3 13a4 4 0 004 4m6-12a4 4 0 100 8m-11 12a4 4 0 100-8m7-12a4 4 0 100 8" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Relevant Opportunities</h3>
                <p className="text-gray-600">Connect with authentic health and wellness brands that align with your values and content style.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-secondary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Fair Compensation</h3>
                <p className="text-gray-600">Negotiate and secure fair compensation with a transparent payment system and secure escrow services.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-4 text-secondary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Grow Your Portfolio</h3>
                <p className="text-gray-600">Showcase your expertise with a professional portfolio and gain access to resources for content excellence.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-primary-600 text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Join the Wellfluence Ecosystem?</h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 opacity-90">
              Whether you're a brand seeking impactful partnerships or an influencer ready to elevate your career, Wellfluence is your platform.
            </p>
            <Link href="/register" className="px-10 py-5 bg-white text-primary-600 font-bold rounded-full text-lg shadow-xl hover:bg-gray-100 transition duration-300 transform hover:scale-105">
              Get Started Today
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Wellfluence</h3>
            <p className="text-sm">Connecting health & wellness with influence.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/for-brands" className="hover:text-primary-400">For Brands</Link></li>
              <li><Link href="/for-influencers" className="hover:text-primary-400">For Influencers</Link></li>
              <li><Link href="/campaigns" className="hover:text-primary-400">Explore Campaigns</Link></li>
              <li><Link href="/influencers" className="hover:text-primary-400">Find Influencers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary-400">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary-400">Contact</Link></li>
              <li><Link href="/careers" className="hover:text-primary-400">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy-policy" className="hover:text-primary-400">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary-400">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-primary-400">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Wellfluence. All rights reserved.
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
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.role);
        router.push('/'); // Redirect to dashboard or home after successful login
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An unexpected error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              register for a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 text-center" role="alert">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-300"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
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
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

type UserRole = 'BRAND' | 'INFLUENCER' | 'CUSTOMER';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') as UserRole || 'CUSTOMER';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', { email, password, role });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.role);
        router.push('/'); // Redirect to dashboard or home after successful registration
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.data && err.response.data.errors) {
        setError(err.response.data.errors[0].message || 'Validation error.');
      }
      else {
        setError('An unexpected error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your Wellfluence account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px mb-4">
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password (min 8 characters)"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">I am registering as a:</label>
            <div className="mt-1 grid grid-cols-3 gap-3">
              {(['BRAND', 'INFLUENCER', 'CUSTOMER'] as UserRole[]).map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-center p-3 border rounded-md text-sm font-medium uppercase cursor-pointer transition-colors duration-200
                    ${
                      role === r
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="sr-only"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 text-center" role="alert">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-300"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register'
              )}
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

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000', // Ensure this matches your backend PORT
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      // window.location.href = '/login'; // Or use Next.js router for client-side navigation
    }
    return Promise.reject(error);
  }
);

export default api;
===ENDFILE===