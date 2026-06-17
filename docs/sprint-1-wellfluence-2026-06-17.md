# Sprint 1: Wellfluence

> Goal: Foundation — Prisma schema + Hono.js API + Next.js landing page
> Date: 2026-06-17

---

## Sprint Summary

✅ ฟีเจอร์ที่สร้างเสร็จแล้ว (Features Implemented)
• สร้างโครงสร้างฐานข้อมูลเริ่มต้นด้วย Prisma Schema (Initial database schema defined with Prisma)
• พัฒนา API Backend ด้วย Hono.js สำหรับการยืนยันตัวตนและการจัดการโปรไฟล์พื้นฐาน (Developed Hono.js backend API for authentication and basic profile management)
• ตั้งค่าระบบจัดการสภาพแวดล้อม (Environment variable management setup)
• พัฒนาระบบยืนยันตัวตนผู้ใช้ (การลงทะเบียนและเข้าสู่ระบบ) ด้วย JWT และการแฮชรหัสผ่าน (Developed user authentication system (register & login) with JWT and password hashing)
• สร้าง Middleware สำหรับการยืนยันตัวตนและการอนุญาตสิทธิ์ตามบทบาท (Auth middleware and role-based authorization created)
• สร้าง API สำหรับจัดการโปรไฟล์ Brand (ดึงข้อมูล, อัปเดต, ลบ) (API for Brand profile management (fetch, update, delete))
• สร้าง API สำหรับจัดการโปรไฟล์ Influencer (ดึงข้อมูล, อัปเดต, ลบ, เชื่อมต่อ/ยกเลิก Social Media) (API for Influencer profile management (fetch, update, delete, connect/disconnect Social Media))
• สร้างหน้า Landing Page แรกด้วย Next.js (Initial Next.js Landing Page built)
• สร้างหน้า Login และ Register ด้วย Next.js และเชื่อมต่อกับ Backend API (Login and Register pages built with Next.js, connected to Backend API)
• ตั้งค่า Axios สำหรับการเรียก API และการจัดการ Token (Axios setup for API calls and token management)
• กำหนดโครงสร้าง Tailwind CSS และธีมสีสำหรับ UI (Tailwind CSS structure and color theme defined for UI)

📊 โมเดลฐานข้อมูล (Database Models)
• User — fields: id, email, passwordHash, role, isActive — relations: Brand?, Influencer?, Follower?, Transaction[]
• Brand — fields: userId, name, logoUrl — relations: User, Campaign[]
• Influencer — fields: userId, bio, expertise, followerCount — relations: User, SocialMediaAccount[], Wallet?
• Follower — fields: userId — relations: User, InfluencerFollow[], Review[], SavedContent[], Notification[]
• InfluencerFollow — fields: followerId, influencerId, followedAt — relations: Follower, Influencer
• Campaign — fields: id, brandId, title, budget, status — relations: Brand, CampaignOffer[], ContentSubmission[], Transaction[]
• CampaignOffer — fields: id, campaignId, influencerId, status — relations: Campaign, Influencer
• ContentSubmission — fields: id, campaignId, influencerId, contentUrl, status — relations: Campaign, Influencer
• Wallet — fields: id, influencerId, balance — relations: Influencer, Transaction[]
• Transaction — fields: id, userId?, walletId?, campaignId?, amount, type, status — relations: User?, Wallet?, Campaign?
• SocialMediaAccount — fields: id, influencerId, platform, accessToken, refreshToken — relations: Influencer
• Review — fields: id, followerId, rating, comment — relations: Follower
•

---

## Code

===FILE: backend/package.json===
{
  "name": "wellfluence-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init"
  },
  "dependencies": {
    "@hono/zod-validator": "^0.2.2",
    "@prisma/client": "^5.14.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "hono": "^4.3.5",
    "jose": "^5.3.0",
    "zod": "^3.23.8"
  },
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
    "lib": [
      "ES2022"
    ],
    "types": [
      "@types/node"
    ]
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
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/wellfluence?schema=public"
JWT_SECRET="YOUR_SUPER_SECRET_JWT_KEY_HERE"
JWT_EXPIRES_IN="1h" # e.g., 1h, 7d, 24h
FRONTEND_URL="http://localhost:3000" # For CORS
===ENDFILE===
===FILE: backend/src/index.ts===
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadEnv } from './lib/env';
import { authRoutes } from './routes/auth.route';
import { brandRoutes } from './routes/brand.route';
import { influencerRoutes } from './routes/influencer.route';
import { HTTPException } from 'hono/http-exception';

// Load environment variables
loadEnv();

const app = new Hono();

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Health check route
app.get('/', (c) => {
  return c.text('Wellfluence Backend API is running!');
});

// Mount routes
app.route('/auth', authRoutes);
app.route('/brands', brandRoutes);
app.route('/influencers', influencerRoutes);

// Custom error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(`${err}`);
  return c.json({ message: 'An internal server error occurred', error: err.message }, 500);
});

export default app;
===ENDFILE===
===FILE: backend/src/lib/prisma.ts===
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of PrismaClient in development
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}

export default prisma;
===ENDFILE===
===FILE: backend/src/lib/auth.ts===
import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export const signJwt = async (payload: JWTPayload): Promise<string> => {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
};

export const verifyJwt = async (token: string): Promise<JWTPayload> => {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
===ENDFILE===
===FILE: backend/src/lib/env.ts===
import dotenv from 'dotenv';
import path from 'path';

export const loadEnv = () => {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });

  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL'];
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      console.error(`Environment variable ${varName} is not set.`);
      process.exit(1);
    }
  }
};
===ENDFILE===
===FILE: backend/src/middleware/auth.middleware.ts===
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
===ENDFILE===
===FILE: backend/src/routes/auth.route.ts===
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, signJwt } from '../lib/auth';
import { UserRole } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

export const authRoutes = new Hono();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Invalid role. Must be BRAND, INFLUENCER, or FOLLOWER' }),
  }),
});

authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, role } = c.req.valid('json');

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new HTTPException(409, { message: 'User with this email already exists' });
  }

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role,
          isActive: true,
        },
      });

      switch (role) {
        case UserRole.BRAND:
          await tx.brand.create({
            data: {
              userId: newUser.id,
              name: `New Brand ${newUser.id.substring(0, 4)}`,
            },
          });
          break;
        case UserRole.INFLUENCER:
          await tx.influencer.create({
            data: {
              userId: newUser.id,
              expertise: [], // Default empty array
            },
          });
          await tx.wallet.create({
            data: {
              influencerId: newUser.id,
              balance: 0,
            },
          });
          break;
        case UserRole.FOLLOWER:
          await tx.follower.create({
            data: {
              userId: newUser.id,
            },
          });
          break;
        default:
          throw new HTTPException(400, { message: 'Invalid user role' });
      }
      return newUser;
    });
  } catch (error: any) {
    console.error('Registration failed during transaction:', error);
    throw new HTTPException(500, { message: 'Registration failed due to a database error' });
  }

  const token = await signJwt({ userId: user.id, email: user.email, role: user.role });

  return c.json({
    message: 'User registered successfully',
    token,
    user: { id: user.id, email: user.email, role: user.role },
  }, 201);
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new HTTPException(401, { message: 'Invalid credentials' });
  }

  if (!user.isActive) {
    throw new HTTPException(403, { message: 'Account is inactive. Please contact support.' });
  }

  const token = await signJwt({ userId: user.id, email: user.email, role: user.role });

  return c.json({
    message: 'Login successful',
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});
===ENDFILE===
===FILE: backend/src/routes/brand.route.ts===
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../lib/prisma';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

export const brandRoutes = new Hono();

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  logoUrl: z.string().url('Invalid URL format').optional().nullable(),
  companyInfo: z.string().optional().nullable(),
  contactInfo: z.string().optional().nullable(),
});

// Get all brands (Admin only, or maybe paginated for Influencers later)
brandRoutes.get('/', authMiddleware, authorizeRoles(UserRole.ADMIN), async (c) => {
  const brands = await prisma.brand.findMany({
    include: {
      user: {
        select: {
          email: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  });
  return c.json(brands);
});

// Get a single brand by ID
brandRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const brand = await prisma.brand.findUnique({
    where: { userId: id },
    include: { user: { select: { email: true, role: true } } },
  });
  if (!brand) {
    throw new HTTPException(404, { message: 'Brand not found' });
  }
  return c.json(brand);
});

// Create a new brand profile (handled by registration, but admin could create one for existing user)
// For this sprint, brand creation is implicitly handled during user registration with role BRAND.
// This route is provided for an explicit admin-driven creation or later expansion.
brandRoutes.post('/', authMiddleware, authorizeRoles(UserRole.ADMIN), zValidator('json', brandSchema.extend({
  userId: z.string().uuid("Invalid user ID format"),
})), async (c) => {
  const { userId, ...data } = c.req.valid('json');

  const existingBrand = await prisma.brand.findUnique({ where: { userId } });
  if (existingBrand) {
    throw new HTTPException(409, { message: 'Brand profile already exists for this user' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== UserRole.BRAND) {
    throw new HTTPException(400, { message: 'User not found or not a Brand user' });
  }

  const brand = await prisma.brand.create({
    data: {
      userId,
      ...data,
    },
  });
  return c.json(brand, 201);
});

// Update a brand profile (Brand owner or Admin)
brandRoutes.put('/:id', authMiddleware, authorizeRoles(UserRole.BRAND, UserRole.ADMIN), zValidator('json', brandSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const userIdFromToken = c.get('userId');
  const roleFromToken = c.get('role');
  const data = c.req.valid('json');

  // A brand user can only update their own profile
  if (roleFromToken === UserRole.BRAND && userIdFromToken !== id) {
    throw new HTTPException(403, { message: 'Forbidden: You can only update your own brand profile' });
  }

  const brand = await prisma.brand.update({
    where: { userId: id },
    data,
  });
  return c.json(brand);
});

// Delete a brand profile (Admin only)
brandRoutes.delete('/:id', authMiddleware, authorizeRoles(UserRole.ADMIN), async (c) => {
  const id = c.req.param('id');

  try {
    await prisma.brand.delete({ where: { userId: id } });
    // Also consider deleting the associated user or setting their status to inactive
    await prisma.user.delete({ where: { id } });
    return c.json({ message: 'Brand and associated user deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new HTTPException(404, { message: 'Brand not found' });
    }
    console.error('Error deleting brand:', error);
    throw new HTTPException(500, { message: 'Failed to delete brand' });
  }
});
===ENDFILE===
===FILE: backend/src/routes/influencer.route.ts===
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../lib/prisma';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware';
import { UserRole, ContentType, SocialPlatform } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';

export const influencerRoutes = new Hono();

const influencerSchema = z.object({
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional().nullable(),
  profilePictureUrl: z.string().url('Invalid URL format').optional().nullable(),
  expertise: z.array(z.string()).optional(),
  contentTypes: z.array(z.nativeEnum(ContentType)).optional(),
  followerCount: z.number().int().min(0).optional(),
  engagementRate: z.number().min(0).max(100).optional(), // Percentage
});

const socialMediaAccountSchema = z.object({
  platform: z.nativeEnum(SocialPlatform),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(), // Some platforms provide refresh tokens
  profileId: z.string().optional().nullable(),
});

// Get all influencers (for Brands to discover, or Admin)
influencerRoutes.get('/', authMiddleware, authorizeRoles(UserRole.BRAND, UserRole.ADMIN), async (c) => {
  const influencers = await prisma.influencer.findMany({
    select: {
      userId: true,
      bio: true,
      profilePictureUrl: true,
      expertise: true,
      contentTypes: true,
      followerCount: true,
      engagementRate: true,
      user: {
        select: {
          email: true,
          isActive: true,
          createdAt: true,
        },
      },
      socialMediaAccounts: {
        select: {
          platform: true,
          profileId: true,
          lastSyncedAt: true,
        },
      },
      wallet: {
        select: {
          balance: true,
        },
      },
    },
  });
  return c.json(influencers);
});

// Get a single influencer by ID
influencerRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const influencer = await prisma.influencer.findUnique({
    where: { userId: id },
    include: {
      user: { select: { email: true, role: true } },
      socialMediaAccounts: {
        select: {
          platform: true,
          profileId: true,
          lastSyncedAt: true,
        },
      },
      wallet: { select: { balance: true } },
    },
  });
  if (!influencer) {
    throw new HTTPException(404, { message: 'Influencer not found' });
  }
  return c.json(influencer);
});

// Update an influencer profile (Influencer owner or Admin)
influencerRoutes.put('/:id', authMiddleware, authorizeRoles(UserRole.INFLUENCER, UserRole.ADMIN), zValidator('json', influencerSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const userIdFromToken = c.get('userId');
  const roleFromToken = c.get('role');
  const data = c.req.valid('json');

  if (roleFromToken === UserRole.INFLUENCER && userIdFromToken !== id) {
    throw new HTTPException(403, { message: 'Forbidden: You can only update your own influencer profile' });
  }

  const influencer = await prisma.influencer.update({
    where: { userId: id },
    data,
    include: { user: { select: { email: true, role: true } } },
  });
  return c.json(influencer);
});

// Delete an influencer profile (Admin only)
influencerRoutes.delete('/:id', authMiddleware, authorizeRoles(UserRole.ADMIN), async (c) => {
  const id = c.req.param('id');

  try {
    await prisma.$transaction(async (tx) => {
      // Delete related entries first
      await tx.socialMediaAccount.deleteMany({ where: { influencerId: id } });
      await tx.wallet.deleteMany({ where: { influencerId: id } });
      // Potentially other relations like ContentSubmissions, etc.
      await tx.influencer.delete({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });
    return c.json({ message: 'Influencer and associated user deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new HTTPException(404, { message: 'Influencer not found' });
    }
    console.error('Error deleting influencer:', error);
    throw new HTTPException(500, { message: 'Failed to delete influencer' });
  }
});

// Connect social media account
influencerRoutes.post('/:id/social-media', authMiddleware, authorizeRoles(UserRole.INFLUENCER, UserRole.ADMIN), zValidator('json', socialMediaAccountSchema), async (c) => {
  const influencerId = c.req.param('id');
  const userIdFromToken = c.get('userId');
  const roleFromToken = c.get('role');
  const data = c.req.valid('json');

  if (roleFromToken === UserRole.INFLUENCER && userIdFromToken !== influencerId) {
    throw new HTTPException(403, { message: 'Forbidden: You can only connect social media to your own profile' });
  }

  const existingAccount = await prisma.socialMediaAccount.findFirst({
    where: { influencerId, platform: data.platform },
  });

  if (existingAccount) {
    // Update existing account
    const updatedAccount = await prisma.socialMediaAccount.update({
      where: { id: existingAccount.id },
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        profileId: data.profileId,
        lastSyncedAt: new Date(),
      },
    });
    return c.json({ message: 'Social media account updated', account: updatedAccount });
  } else {
    // Create new account
    const newAccount = await prisma.socialMediaAccount.create({
      data: {
        influencerId,
        ...data,
        lastSyncedAt: new Date(),
      },
    });
    return c.json({ message: 'Social media account connected', account: newAccount }, 201);
  }
});

// Disconnect social media account
influencerRoutes.delete('/:id/social-media/:platform', authMiddleware, authorizeRoles(UserRole.INFLUENCER, UserRole.ADMIN), async (c) => {
  const influencerId = c.req.param('id');
  const platform = c.req.param('platform').toUpperCase() as SocialPlatform;
  const userIdFromToken = c.get('userId');
  const roleFromToken = c.get('role');

  if (roleFromToken === UserRole.INFLUENCER && userIdFromToken !== influencerId) {
    throw new HTTPException(403, { message: 'Forbidden: You can only disconnect social media from your own profile' });
  }

  try {
    const deletedAccount = await prisma.socialMediaAccount.delete({
      where: {
        influencerId_platform: {
          influencerId,
          platform,
        },
      },
    });
    return c.json({ message: `Social media account for ${platform} disconnected`, account: deletedAccount });
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new HTTPException(404, { message: 'Social media account not found for this influencer and platform' });
    }
    console.error('Error disconnecting social media:', error);
    throw new HTTPException(500, { message: 'Failed to disconnect social media account' });
  }
});
===ENDFILE===
===FILE: prisma/schema.prisma===
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  BRAND
  INFLUENCER
  FOLLOWER
}

enum CampaignStatus {
  DRAFT
  PENDING_APPROVAL
  ACTIVE
  COMPLETED
  CANCELLED
}

enum ContentType {
  IMAGE
  VIDEO
  STORY
  REEL
  ARTICLE
  REVIEW
}

enum ContentSubmissionStatus {
  PENDING
  APPROVED
  REJECTED
  PUBLISHED
}

enum TransactionType {
  CAMPAIGN_PAYMENT // Brand paying for campaign
  INFLUENCER_PAYOUT // Wellfluence paying influencer
  PLATFORM_COMMISSION
  BRAND_TOPUP
  SUBSCRIPTION
  AFFILIATE_REVENUE
}

enum SocialPlatform {
  INSTAGRAM
  FACEBOOK
  TIKTOK
  YOUTUBE
}

model User {
  id             String      @id @default(uuid())
  email          String      @unique
  passwordHash   String
  role           UserRole
  isActive       Boolean     @default(true)
  twoFactorEnabled Boolean     @default(false)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  brand          Brand?
  influencer     Influencer?
  follower       Follower?
  transactions   Transaction[]
}

model Brand {
  userId        String      @id @unique
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  logoUrl       String?
  companyInfo   String?
  contactInfo   String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  campaigns     Campaign[]

  @@index([name])
}

model Influencer {
  userId             String               @id @unique
  user               User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio                String?              @db.VarChar(500)
  profilePictureUrl  String?
  expertise          String[]             @default([]) // e.g., ["Fitness", "Skincare", "Nutrition"]
  contentTypes       ContentType[]        @default([]) // e.g., [VIDEO, STORY]
  followerCount      Int                  @default(0)
  engagementRate     Float                @default(0) // Percentage 0-100
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  socialMediaAccounts SocialMediaAccount[]
  campaignOffers      CampaignOffer[]
  contentSubmissions  ContentSubmission[]
  wallet              Wallet?

  @@index([followerCount])
  @@index([engagementRate])
  @@index([expertise(ops: GinArrayOps)]) // For array search
  @@index([contentTypes(ops: GinArrayOps)]) // For array search
}

model Follower {
  userId    String   @id @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  followedInfluencers InfluencerFollow[]
  reviews             Review[]
  savedContent        SavedContent[]
  notifications       Notification[]
}

model InfluencerFollow {
  followerId    String
  influencerId  String
  followedAt    DateTime @default(now())

  follower      Follower   @relation(fields: [followerId], references: [userId], onDelete: Cascade)
  influencer    Influencer @relation(fields: [influencerId], references: [userId], onDelete: Cascade)

  @@id([followerId, influencerId])
}

model Campaign {
  id               String            @id @default(uuid())
  brandId          String
  brand            Brand             @relation(fields: [brandId], references: [userId], onDelete: Cascade)
  title            String
  description      String
  objectives       String[]
  budget           Float
  targetAudience   String[]
  contentTypesNeeded ContentType[]     @default([])
  kpis             String[]          @default([])
  startDate        DateTime
  endDate          DateTime
  status           CampaignStatus    @default(DRAFT)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  campaignOffers   CampaignOffer[]
  contentSubmissions ContentSubmission[]
  transactions     Transaction[]

  @@index([brandId])
  @@index([status])
  @@index([startDate])
  @@index([endDate])
}

model CampaignOffer {
  id             String            @id @default(uuid())
  campaignId     String
  influencerId   String
  campaign       Campaign          @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  influencer     Influencer        @relation(fields: [influencerId], references: [userId], onDelete: Cascade)
  status         CampaignStatus    @default(PENDING_APPROVAL) // Can be OFFERED, ACCEPTED, REJECTED
  offeredBudget  Float?            // Specific budget for this influencer
  message        String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@unique([campaignId, influencerId])
  @@index([influencerId])
  @@index([status])
}


model ContentSubmission {
  id             String                @id @default(uuid())
  campaignId     String
  influencerId   String
  campaign       Campaign              @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  influencer     Influencer            @relation(fields: [influencerId], references: [userId], onDelete: Cascade)
  contentUrl     String                // URL to the content (image, video, etc.)
  caption        String?
  status         ContentSubmissionStatus @default(PENDING)
  feedback       String?               // Brand's feedback if rejected
  submittedAt    DateTime              @default(now())
  approvedAt     DateTime?
  publishedAt    DateTime?             // When content was actually published by influencer
  proofUrl       String?               // URL to live post or screenshot for verification
  reach          Int?
  engagement     Int?

  @@unique([campaignId, influencerId])
  @@index([influencerId])
  @@index([status])
}

model Wallet {
  id             String       @id @default(uuid())
  influencerId   String       @unique
  influencer     Influencer   @relation(fields: [influencerId], references: [userId], onDelete: Cascade)
  balance        Float        @default(0)
  currency       String       @default("THB") // Assuming default currency is THB for now
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  transactions   Transaction[]
}

model Transaction {
  id             String          @id @default(uuid())
  userId         String?         // User (Brand/Influencer) initiating/receiving transaction
  user           User?           @relation(fields: [userId], references: [id])
  walletId       String?         // Wallet involved (e.g., influencer's wallet for payout)
  wallet         Wallet?         @relation(fields: [walletId], references: [id])
  campaignId     String?
  campaign       Campaign?       @relation(fields: [campaignId], references: [id])
  amount         Float
  currency       String          @default("THB")
  type           TransactionType
  status         String          @default("COMPLETED") // PENDING, COMPLETED, FAILED
  description    String?
  paymentGatewayRef String?      // Reference from Stripe/Omise
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([userId])
  @@index([walletId])
  @@index([campaignId])
  @@index([type])
  @@index([status])
}

model SocialMediaAccount {
  id              String         @id @default(uuid())
  influencerId    String
  influencer      Influencer     @relation(fields: [influencerId], references: [userId], onDelete: Cascade)
  platform        SocialPlatform
  profileId       String?        // ID from social media platform (e.g., Instagram user ID)
  username        String?
  accessToken     String         @db.Text
  refreshToken    String?        @db.Text
  lastSyncedAt    DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@unique([influencerId, platform])
  @@index([platform])
}

model Review {
  id          String   @id @default(uuid())
  followerId  String
  campaignId  String?  // Optional: link review to a specific campaign
  influencerId String? // Optional: link review to an influencer directly
  follower    Follower @relation(fields: [followerId], references: [userId], onDelete: Cascade)
  rating      Int      @min(1) @max(5)
  comment     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([followerId])
  @@index([campaignId])
  @@index([influencerId])
}

model SavedContent {
  id          String   @id @default(uuid())
  followerId  String
  follower    Follower @relation(fields: [followerId], references: [userId], onDelete: Cascade)
  contentUrl  String   // URL of the content saved
  description String?
  savedAt     DateTime @default(now())

  @@index([followerId])
}

model Notification {
  id          String      @id @default(uuid())
  recipientId String      // User ID of the recipient (Brand, Influencer, Follower)
  recipient   User        @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  message     String
  type        String      // e.g., "CAMPAIGN_OFFER", "CONTENT_APPROVED", "PROMOTION"
  isRead      Boolean     @default(false)
  sentAt      DateTime    @default(now())
  link        String?     // Optional link to related resource

  @@index([recipientId])
  @@index([isRead])
  @@index([sentAt])
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
    // Other Next.js configurations can go here.
    // For example, if you need to configure images:
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'via.placeholder.com',
        },
        // Add other trusted image hosts here
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
          500: '#22c55e', // Main green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#0f3a21',
        },
        secondary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main red for accents or warnings
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#641414',
        },
        wellness: {
          light: '#e0f2fe', // Sky blue for calm
          medium: '#93c5fd', // Lighter blue
          dark: '#3b82f6', // Stronger blue
          pink: '#fbcfe8', // Light pink for beauty
          purple: '#d8b4fe', // Light purple for luxury
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
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

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply font-sans text-gray-800 bg-white;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-bold text-gray-900;
  }
  a {
    @apply text-primary-600 hover:text-primary-800 transition-colors duration-200;
  }
  button {
    @apply rounded-lg px-6 py-3 font-semibold text-white transition-all duration-200;
  }
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300;
  }
  .btn-secondary {
    @apply bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:ring-gray-300;
  }
  .input-field {
    @apply block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm;
  }
  .label {
    @apply block text-sm font-medium text-gray-700;
  }
}
===ENDFILE===
===FILE: frontend/app/layout.tsx===
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wellfluence - Health & Beauty Influencer Marketing Platform',
  description: 'The premier B2B2C influencer marketing platform connecting health and wellness brands with influential individuals and their followers.',
  keywords: ['Wellfluence', 'influencer marketing', 'health influencer', 'beauty influencer', 'wellness marketing', 'B2B2C', 'health tech'],
  openGraph: {
    title: 'Wellfluence - Health & Beauty Influencer Marketing Platform',
    description: 'The premier B2B2C influencer marketing platform connecting health and wellness brands with influential individuals and their followers.',
    url: 'https://wellfluence.com', // Replace with actual domain
    siteName: 'Wellfluence',
    images: [
      {
        url: 'https://via.placeholder.com/1200x630?text=Wellfluence+OG', // Replace with actual OG image
        width: 1200,
        height: 630,
        alt: 'Wellfluence - Connecting Health & Beauty',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wellfluence - Health & Beauty Influencer Marketing Platform',
    description: 'The premier B2B2C influencer marketing platform connecting health and wellness brands with influential individuals and their followers.',
    images: ['https://via.placeholder.com/1200x675?text=Wellfluence+Twitter'], // Replace with actual Twitter image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  creator: 'Wellfluence Team',
  publisher: 'Wellfluence Team',
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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full bg-white shadow-sm py-4">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Wellfluence
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-primary-600 font-medium">
              Login
            </Link>
            <Link href="/register" className="btn-primary px-5 py-2">
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-500 to-primary-700 text-white py-20 lg:py-32 flex-grow">
        <div className="absolute inset-0 opacity-10 bg-[url('/hero-bg-pattern.svg')] bg-repeat"></div> {/* Optional pattern */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between relative z-10">
          <div className="lg:w-1/2 text-center lg:text-left mb-10 lg:mb-0">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Amplify Your Health & Beauty Brand with Wellfluence
            </h1>
            <p className="text-lg sm:text-xl mb-8 opacity-90">
              Connect with the perfect influencers, measure real impact, and grow your community in the health and wellness industry.
            </p>
            <div className="flex justify-center lg:justify-start space-x-4">
              <Link href="/register" className="btn-secondary bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Join as a Brand
              </Link>
              <Link href="/register" className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-primary-600 px-8 py-3 text-lg">
                Join as an Influencer
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <Image
              src="https://via.placeholder.com/600x400?text=Wellfluence+Hero" // Replace with a relevant image
              alt="Wellfluence platform dashboard"
              width={600}
              height={400}
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-12">
            A One-Stop Platform for Everyone
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature for Brands */}
            <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-primary-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-1.22-8.455-3.245m16.91 0c.917-.071 1.76-.294 2.527-.674m-2.527.674l-2.244-2.244m0 0L19.5 7.25l-.045-9.97c-.035-.785-.563-1.472-1.328-1.758C12.35 1.573 5 4.385 5 4.385S.05 7.25 0 7.25l1.955 4.02C1.986 11.272 2.21 11.495 2.527 11.605m16.91 0c-.917.071-1.76.294-2.527.674m0 0l-2.244 2.244m0 0L19.5 17.25l.045 9.97c.035.785.563 1.472 1.328 1.758C12.35 21.427 5 18.615 5 18.615S.05 15.75 0 15.75l1.955-4.02C1.986 11.728 2.21 11.505 2.527 11.395" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">For Brands</h3>
              <p className="text-gray-600">
                Discover micro-niche influencers, launch targeted campaigns, and track real-time ROI with our advanced analytics dashboard. Simplify your influencer marketing efforts.
              </p>
            </div>
            {/* Feature for Influencers */}
            <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-primary-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">For Influencers</h3>
              <p className="text-gray-600">
                Find relevant brand collaborations, manage campaigns efficiently, ensure transparent payments, and grow your personal brand. Monetize your influence effectively.
              </p>
            </div>
            {/* Feature for Followers */}
            <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-primary-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">For Followers</h3>
              <p className="text-gray-600">
                Access trustworthy health and beauty content, discover new products, enjoy exclusive promotions, and engage directly with your favorite experts and personalities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-wellness-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            Ready to Transform Your Health & Beauty Marketing?
          </h2>
          <p className="text-lg sm:text-xl mb-10 opacity-90">
            Join Wellfluence today and become a part of the next-generation influencer ecosystem.
          </p>
          <Link href="/register" className="btn-primary bg-white text-wellness-dark hover:bg-gray-100 px-10 py-4 text-lg">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-6 md:mb-0">
            <h3 className="text-xl font-bold text-white mb-2">Wellfluence</h3>
            <p className="text-sm">Connecting Health & Beauty, Empowering Influence.</p>
          </div>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
            <nav className="flex flex-col space-y-2">
              <Link href="#" className="hover:text-white transition-colors duration-200">About Us</Link>
              <Link href="#" className="hover:text-white transition-colors duration-200">Contact</Link>
              <Link href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors duration-200">Terms of Service</Link>
            </nav>
            <div className="flex flex-col space-y-2">
              <h4 className="text-md font-semibold text-white">Follow Us</h4>
              <div className="flex justify-center md:justify-start space-x-4">
                {/* Social media icons */}
                <a href="#" aria-label="Facebook" className="hover:text-white transition-colors duration-200">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.776-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33V22H12c5.523 0 10-4.477 10-10z" clipRule="evenodd" /></svg>
                </a>
                <a href="#" aria-label="Instagram" className="hover:text-white transition-colors duration-200">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.715.01 3.67.062C17.5 2.15 18.2 2.376 18.9 2.766c.65.36 1.174.836 1.627 1.288.453.453.896.982 1.288 1.627.39.7.614 1.4.704 2.315.052.955.062 1.24.062 3.67s-.01 2.715-.062 3.67c-.09.915-.314 1.614-.704 2.315a4.935 4.935 0 01-1.288 1.627c-.453.453-.982.896-1.627 1.288-.7.39-1.4.614-2.315.704-.955.052-1.24.062-3.67.062s-2.715-.01-3.67-.062c-.915-.09-1.614-.314-2.315-.704a4.935 4.935 0 01-1.627-1.288c-.453-.453-.896-.982-1.288-1.627-.39-.7-.614-1.4-.704-2.315-.052-.955-.062-1.24-.062-3.67s.01-2.715.062-3.67c.09-.915.314-1.614.704-2.315a4.935 4.935 0 011.288-1.627c.453-.453.982-.896 1.627-1.288.7-.39 1.4-.614 2.315-.704.955-.052 1.24-.062 3.67-.062zm0 1.6c-2.31 0-2.585.01-3.485.051-.845.08-1.386.297-1.748.497-.37.2-.676.455-.989.768-.314.314-.568.644-.768.989-.2.362-.417.903-.497 1.748-.041.9-.051 1.175-.051 3.485s.01 2.585.051 3.485c.08.845.297 1.386.497 1.748.2.37.455.676.768.989.314.314.644.568.989.768.362.2.903.417 1.748.497.9.041 1.175.051 3.485.051s2.585-.01 3.485-.051c.845-.08 1.386-.297 1.748-.497.37-.2.676-.455.989-.768.314-.314.568-.644.768-.989.2-.362.417-.903.497-1.748.041-.9.051-1.175.051-3.485s-.01-2.585-.051-3.485c-.08-.845-.297-1.386-.497-1.748-.2-.37-.455-.676-.768-.989a3.33 3.33 0 00-.989-.768c-.362-.2-.903-.417-1.748-.497-.9-.041-1.175-.051-3.485-.051zm0 4.865a3.685 3.685 0 100 7.37 3.685 3.685 0 000-7.37zM12.315 9c-1.87 0-3.375 1.505-3.375 3.375s1.505 3.375 3.375 3.375S15.69 14.25 15.69 12.375C15.69 10.505 14.185 9 12.315 9zm4.232-5.46a.865.865 0 01-.865.865.865.865 0 01-.865-.865.865.865 0 01.865-.865c.478 0 .865.387.865.865z" clipRule="evenodd" /></svg>
                </a>
                {/* Add TikTok, YouTube, etc. */}
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-8 pt-6 border-t border-gray-700">
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

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

    if (!email || !password) {
      setError('Please fill in both email and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', user.role); // Store user role for role-based redirection
      
      switch (user.role) {
        case 'BRAND':
          router.push('/dashboard/brand'); // Redirect to brand dashboard
          break;
        case 'INFLUENCER':
          router.push('/dashboard/influencer'); // Redirect to influencer dashboard
          break;
        case 'FOLLOWER':
          router.push('/dashboard/follower'); // Redirect to follower dashboard
          break;
        default:
          router.push('/dashboard'); // Generic dashboard if role not explicitly handled
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
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
                className="input-field rounded-t-md"
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
                className="input-field rounded-b-md"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-secondary-100 border border-secondary-400 text-secondary-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
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

type UserRole = 'BRAND' | 'INFLUENCER' | 'FOLLOWER';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('FOLLOWER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password || !confirmPassword || !role) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', { email, password, role });
      const { token, user } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', user.role); // Store user role for redirection
      
      switch (user.role) {
        case 'BRAND':
          router.push('/dashboard/brand');
          break;
        case 'INFLUENCER':
          router.push('/dashboard/influencer');
          break;
        case 'FOLLOWER':
          router.push('/dashboard/follower');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your Wellfluence account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
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
                className="input-field rounded-t-md"
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
                className="input-field rounded-none"
                placeholder="Password (min. 8 characters)"
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
                className="input-field rounded-b-md"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="label mb-1">
              I am registering as:
            </label>
            <select
              id="role"
              name="role"
              required
              className="input-field mt-1"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="FOLLOWER">Follower / Customer</option>
              <option value="INFLUENCER">Influencer</option>
              <option value="BRAND">Brand</option>
            </select>
          </div>

          {error && (
            <div className="bg-secondary-100 border border-secondary-400 text-secondary-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={loading}
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'; // Default to Hono's default port

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling, e.g., refreshing token or logging out on 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., clear token and redirect to login
      console.warn('Unauthorized request. Clearing token and redirecting to login.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      // Redirect to login page only if not already on it
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);
===ENDFILE===