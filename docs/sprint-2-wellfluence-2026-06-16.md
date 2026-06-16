# Sprint 2: Wellfluence

> Goal: สร้าง Foundation: Auth + User Profile
> Date: 2026-06-16

---

## Sprint Summary

สวัสดีครับทีม Wellfluence และคุณ Founder

ผมในฐานะ Product Manager ของโปรเจกต์ Wellfluence ขอสรุปผลงานของ **Sprint 2: "สร้าง Foundation: Auth + User Profile"** ตามที่ได้วางแผนไว้ครับ Sprint นี้เราเน้นการวางรากฐานสำคัญสำหรับการจัดการผู้ใช้และการสร้างโปรไฟล์เบื้องต้น ซึ่งเป็นหัวใจสำคัญของการเข้าใช้งานแพลตฟอร์มของเรา

---

### **✅ Features Implemented (ฟีเจอร์ที่ทำสำเร็จแล้วใน Sprint นี้)**

*   **ระบบสมัครสมาชิก:**
    *   ผู้ใช้สามารถลงทะเบียนบัญชีใหม่ได้ โดยเลือกบทบาทเป็น "แบรนด์" หรือ "อินฟลูเอนเซอร์" ได้ตั้งแต่ต้น
    *   ระบบจะสร้างโปรไฟล์เริ่มต้นที่เหมาะสมกับบทบาทนั้นๆ ให้ทันทีหลังการลงทะเบียน
*   **ระบบเข้าสู่ระบบ:**
    *   ผู้ใช้สามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
    *   ระบบจะออกรหัสยืนยันตัวตน (Token) ให้ผู้ใช้เพื่อใช้ในการเข้าถึงฟังก์ชันอื่นๆ ที่ต้องมีการยืนยัน
*   **การยืนยันอีเมล:**
    *   หลังการลงทะเบียน ผู้ใช้จะได้รับอีเมลพร้อมลิงก์เพื่อยืนยันตัวตน
    *   เมื่อคลิกลิงก์ อีเมลของผู้

---

## Code

สวัสดีครับทีม Wellfluence ผมในฐานะ Senior Full-Stack Developer ของโปรเจกต์นี้ ขอเริ่มงานใน Sprint 2 โดยมีเป้าหมายหลักคือ **"สร้าง Foundation: Auth + User Profile"** ตาม PRD ที่ได้รับมาครับ

จากการตรวจสอบ PRD และ Sprint Goal ผมได้ระบุฟีเจอร์หลักๆ ที่ต้องเริ่มดำเนินการดังนี้:

**ฟีเจอร์ที่ต้อง Implement ใน Sprint 2:**

*   **5.1 Authentication & User Management:**
    *   การลงทะเบียนผู้ใช้ (บทบาท Brand และ Influencer)
    *   การเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน
    *   การรีเซ็ตรหัสผ่าน/ลืมรหัสผ่าน
    *   การสร้างและจัดการโปรไฟล์เบื้องต้น (รายละเอียดแบรนด์, ประวัติอินฟลูเอนเซอร์, ลิงก์โซเชียลสำหรับ Influencer)
    *   การควบคุมการเข้าถึงตามบทบาท (RBAC - กำหนด Role ใน Schema)
    *   การยืนยันอีเมล

**ข้อสังเกตและ Tech Stack:**

*   **Backend:** PRD ระบุ `NestJS` แต่คำสั่งของ Sprint ให้ใช้ `Hono.js routes + Prisma queries` ผมจะยึดตามคำสั่ง Sprint คือ `Hono.js` สำหรับ routes และ `Prisma` สำหรับ ORM (ซึ่งใช้ `PostgreSQL` เป็น Database)
*   **Frontend:** `Next.js` (React, TypeScript)
*   **การส่งอีเมล:** สำหรับการยืนยันอีเมลและการรีเซ็ตรหัสผ่าน ใน Sprint นี้จะเน้นที่การสร้าง logic และการจำลองการส่งอีเมล (Mock Email Service) เพื่อให้ระบบ Auth ทำงานได้ครบถ้วน โดยยังไม่ผสานรวมกับ Third-party API อย่าง `SendGrid` หรือ `Twilio` อย่างสมบูรณ์ แต่จะเตรียมโครงสร้างไว้รองรับ

---

### **1. Database Schema (Prisma)**

เราจะเริ่มต้นด้วยการสร้าง Schema พื้นฐานใน Prisma เพื่อรองรับข้อมูลผู้ใช้, โปรไฟล์สำหรับ Brand และ Influencer, ลิงก์โซเชียล, และ Verification Token สำหรับการยืนยันอีเมลและการรีเซ็ตรหัสผ่าน

**filepath: `prisma/schema.prisma`**

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enum สำหรับ Role ของผู้ใช้
enum UserRole {
  BRAND
  INFLUENCER
  ADMIN // สำหรับทีมงาน Wellfluence
}

// Enum สำหรับ Platform ของ Social Media Links
enum SocialPlatform {
  INSTAGRAM
  TIKTOK
  YOUTUBE
  FACEBOOK
  // สามารถเพิ่ม platform อื่นๆ ได้ในอนาคต เช่น Twitter, LinkedIn, etc.
}

// Enum สำหรับประเภทของ Verification Token
enum TokenType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
}

// โมเดล User: เก็บข้อมูลพื้นฐานของผู้ใช้
model User {
  id              String             @id @default(uuid())
  email           String             @unique
  passwordHash    String             // เก็บ hashedPassword
  role            UserRole           @default(INFLUENCER) // กำหนดค่า default
  isEmailVerified Boolean            @default(false)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  brandProfile      BrandProfile?
  influencerProfile InfluencerProfile?
  verificationTokens VerificationToken[]
}

// โมเดล BrandProfile: เก็บข้อมูลเฉพาะของแบรนด์
model BrandProfile {
  id                String    @id @default(uuid())
  userId            String    @unique
  companyName       String
  description       String?
  website           String?
  brandGuidelinesUrl String? // URL สำหรับ Brand Guidelines
  contactEmail      String?
  contactPhone      String?
  logoUrl           String?
  address           String?
  city              String?
  country           String?
  postalCode        String?

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

// โมเดล InfluencerProfile: เก็บข้อมูลเฉพาะของอินฟลูเอนเซอร์
model InfluencerProfile {
  id              String           @id @default(uuid())
  userId          String           @unique
  bio             String?
  niche           String? // เช่น "Fitness", "Beauty", "Nutrition"
  profilePictureUrl String?
  portfolioUrl    String? // URL ไปยัง portfolio ภายนอก หรืออาจจะเป็นส่วนหนึ่งของแพลตฟอร์ม
  location        String? // เช่น "Bangkok, Thailand"
  contactEmail    String?
  contactPhone    String?

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  socialLinks     SocialLink[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

// โมเดล SocialLink: เก็บลิงก์โซเชียลมีเดียของอินฟลูเอนเซอร์
model SocialLink {
  id                  String         @id @default(uuid())
  influencerProfileId String
  platform            SocialPlatform
  url                 String
  handle              String?        // ชื่อผู้ใช้บน platform นั้นๆ
  connectedAt         DateTime       @default(now())

  influencerProfile   InfluencerProfile @relation(fields: [influencerProfileId], references: [id], onDelete: Cascade)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
}

// โมเดล VerificationToken: สำหรับ Email Verification และ Password Reset
model VerificationToken {
  id         String    @id @default(uuid())
  userId     String
  token      String    @unique // Unique token
  type       TokenType
  expiresAt  DateTime
  createdAt  DateTime  @default(now())

  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**หลังจากเพิ่ม Schema นี้ ให้รันคำสั่ง Prisma เพื่อ migrate database:**
```bash
npx prisma migrate dev --name init_auth_user_profile
npx prisma generate
```

---

### **2. Backend (Hono.js + Prisma)**

เราจะสร้าง API routes สำหรับการลงทะเบียน, เข้าสู่ระบบ, การจัดการโปรไฟล์ และการยืนยันอีเมล/รีเซ็ตรหัสผ่าน

**โครงสร้างไฟล์ Backend โดยประมาณ:**

```
src/
├── index.ts           // Main Hono app
├── routes/
│   ├── auth.ts        // Authentication routes
│   └── users.ts       // User and Profile management routes
├── middlewares/
│   └── auth.ts        // JWT authentication middleware
├── services/
│   ├── auth.ts        // Business logic for authentication
│   ├── user.ts        // Business logic for user/profile management
│   └── email.ts       // Email sending (mocked for now)
├── utils/
│   ├── jwt.ts         // JWT token handling
│   └── password.ts    // Password hashing
└── prisma.ts          // Prisma client instance
```

**2.1 Prisma Client Instance**

**filepath: `src/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

**2.2 Utils for Password Hashing and JWT**

**filepath: `src/utils/password.ts`**

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**filepath: `src/utils/jwt.ts`**

```typescript
import { sign, verify } from 'hono/jwt';
import { env } from 'hono/adapter'; // ต้องติดตั้ง 'hono-env' หรือใช้ 'hono/adapter'

// กำหนด SECRET KEY จาก Environment Variable
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_please_change_me';

interface JwtPayload {
  userId: string;
  role: string;
  exp?: number;
}

export async function generateToken(payload: JwtPayload): Promise<string> {
  return sign(payload, JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const decoded = await verify(token, JWT_SECRET);
    return decoded as JwtPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
```
**หมายเหตุ:** สำหรับ `JWT_SECRET` ควรตั้งค่าในไฟล์ `.env` ใน production ครับ

**2.3 Mock Email Service**

**filepath: `src/services/email.ts`**

```typescript
// ใน Sprint นี้เราจะจำลองการส่งอีเมล
// ในอนาคตจะเชื่อมต่อกับ SendGrid, Twilio หรือบริการอื่น ๆ
interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  console.log('--- MOCK EMAIL SENT ---');
  console.log('To:', options.to);
  console.log('Subject:', options.subject);
  console.log('Body:', options.body);
  if (options.html) {
    console.log('HTML:', options.html);
  }
  console.log('-----------------------');
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
}

export function generateVerificationEmailBody(userName: string, verificationLink: string): string {
  return `สวัสดีคุณ ${userName},

โปรดยืนยันอีเมลของคุณโดยคลิกลิงก์ด้านล่าง:
${verificationLink}

หากคุณไม่ได้ลงทะเบียนกับ Wellfluence โปรดเพิกเฉยอีเมลนี้

ขอแสดงความนับถือ,
ทีม Wellfluence
`;
}

export function generatePasswordResetEmailBody(userName: string, resetLink: string): string {
  return `สวัสดีคุณ ${userName},

คุณได้ทำการร้องขอรีเซ็ตรหัสผ่านสำหรับบัญชี Wellfluence ของคุณ
โปรดคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:
${resetLink}

ลิงก์นี้จะหมดอายุในอีก 1 ชั่วโมง.
หากคุณไม่ได้ร้องขอการรีเซ็ตรหัสผ่าน โปรดเพิกเฉยอีเมลนี้

ขอแสดงความนับถือ,
ทีม Wellfluence
`;
}
```

**2.4 Authentication Middleware**

**filepath: `src/middlewares/auth.ts`**

```typescript
import { createMiddleware } from 'hono/factory';
import { verifyToken } from '../utils/jwt';
import prisma from '../prisma';
import { UserRole } from '@prisma/client';

export interface AuthContext {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'No token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = await verifyToken(token);

  if (!decoded) {
    return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true, isEmailVerified: true },
  });

  if (!user) {
    return c.json({ error: 'Unauthorized', message: 'User not found' }, 401);
  }

  // Check if email is verified for certain actions (optional, but good practice)
  // if (!user.isEmailVerified && c.req.path !== '/auth/verify-email') {
  //   return c.json({ error: 'Forbidden', message: 'Email not verified' }, 403);
  // }

  // Attach user info to context
  c.set('user', user);

  await next();
});

// Middleware for role-based access control
export const authorize = (...roles: UserRole[]) => createMiddleware(async (c, next) => {
  const user = c.get('user') as AuthContext['user'];
  if (!user || !roles.includes(user.role)) {
    return c.json({ error: 'Forbidden', message: 'Insufficient permissions' }, 403);
  }
  await next();
});
```
**หมายเหตุ:** เพื่อให้ Hono รู้จัก `c.get('user')` ควรมีการขยายประเภทของ `Context` ใน Hono เช่นใน `src/index.ts` หรือไฟล์ declaration:
```typescript
// src/types/hono.d.ts (หรือใน index.ts)
import 'hono';
import { UserRole } from '@prisma/client';

declare module 'hono' {
  interface ContextVariableMap {
    user: {
      id: string;
      email: string;
      role: UserRole;
      isEmailVerified: boolean;
    };
  }
}
```

**2.5 Backend Services (Business Logic)**

**filepath: `src/services/auth.ts`**

```typescript
import prisma from '../prisma';
import { UserRole, TokenType } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendEmail, generateVerificationEmailBody, generatePasswordResetEmailBody } from './email';

const VERIFICATION_TOKEN_EXPIRATION_HOURS = 24;
const PASSWORD_RESET_TOKEN_EXPIRATION_HOURS = 1;

export async function registerUser(email: string, password: string, role: UserRole) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email already registered.');
  }

  const passwordHash = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      isEmailVerified: false, // Default to false, require email verification
    },
  });

  // Create initial profile based on role
  if (role === UserRole.BRAND) {
    await prisma.brandProfile.create({
      data: {
        userId: newUser.id,
        companyName: `New Brand - ${newUser.id.substring(0, 8)}`, // Placeholder
      },
    });
  } else if (role === UserRole.INFLUENCER) {
    await prisma.influencerProfile.create({
      data: {
        userId: newUser.id,
        bio: `Hello, I'm a new influencer on Wellfluence!`, // Placeholder
      },
    });
  }

  // Generate and send email verification token
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      userId: newUser.id,
      token,
      type: TokenType.EMAIL_VERIFICATION,
      expiresAt,
    },
  });

  // In a real app, this link would point to your frontend verification page
  const verificationLink = `http://localhost:3000/verify-email?token=${token}`;
  await sendEmail({
    to: newUser.email,
    subject: 'ยืนยันอีเมลของคุณสำหรับ Wellfluence',
    body: generateVerificationEmailBody('ผู้ใช้ใหม่', verificationLink),
  });

  return { userId: newUser.id, email: newUser.email, role: newUser.role };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new Error('Invalid credentials.');
  }

  // Check for email verification (optional, can be enforced later)
  // if (!user.isEmailVerified) {
  //   throw new Error('Please verify your email first.');
  // }

  const token = await generateToken({ userId: user.id, role: user.role });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function verifyEmail(token: string) {
  const verificationRecord = await prisma.verificationToken.findFirst({
    where: {
      token,
      type: TokenType.EMAIL_VERIFICATION,
      expiresAt: { gt: new Date() }, // Token must not be expired
    },
    include: { user: true },
  });

  if (!verificationRecord) {
    throw new Error('Invalid or expired verification token.');
  }

  await prisma.user.update({
    where: { id: verificationRecord.userId },
    data: { isEmailVerified: true },
  });

  await prisma.verificationToken.delete({ where: { id: verificationRecord.id } });

  return { message: 'Email verified successfully.', user: verificationRecord.user.email };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success even if user not found to prevent email enumeration
    console.warn(`Password reset requested for non-existent email: ${email}`);
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  // Invalidate any existing password reset tokens for this user
  await prisma.verificationToken.deleteMany({
    where: {
      userId: user.id,
      type: TokenType.PASSWORD_RESET,
    },
  });

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      type: TokenType.PASSWORD_RESET,
      expiresAt,
    },
  });

  // In a real app, this link would point to your frontend reset password page
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'รีเซ็ตรหัสผ่าน Wellfluence ของคุณ',
    body: generatePasswordResetEmailBody(user.email, resetLink),
  });

  return { message: 'Password reset link sent to your email.' };
}

export async function resetPassword(token: string, newPassword: string) {
  const resetRecord = await prisma.verificationToken.findFirst({
    where: {
      token,
      type: TokenType.PASSWORD_RESET,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!resetRecord) {
    throw new Error('Invalid or expired password reset token.');
  }

  const newPasswordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: { passwordHash: newPasswordHash },
  });

  await prisma.verificationToken.delete({ where: { id: resetRecord.id } });

  return { message: 'Password has been reset successfully.' };
}
```

**filepath: `src/services/user.ts`**

```typescript
import prisma from '../prisma';
import { UserRole, SocialPlatform } from '@prisma/client';

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    throw new Error('User not found.');
  }
  return user;
}

export async function getUserProfile(userId: string, role: UserRole) {
  const user = await getUserById(userId);

  if (role === UserRole.BRAND) {
    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId },
    });
    return { user, profile: brandProfile };
  } else if (role === UserRole.INFLUENCER) {
    const influencerProfile = await prisma.influencerProfile.findUnique({
      where: { userId },
      include: { socialLinks: true },
    });
    return { user, profile: influencerProfile };
  }
  return { user, profile: null }; // Should not happen with defined roles
}

export async function updateBrandProfile(userId: string, data: Partial<Omit<typeof prisma.brandProfile.create.arguments.data, 'userId'>>) {
  const profile = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new Error('Brand profile not found for this user.');
  }
  return prisma.brandProfile.update({
    where: { userId },
    data: data,
  });
}

export async function updateInfluencerProfile(userId: string, data: Partial<Omit<typeof prisma.influencerProfile.create.arguments.data, 'userId'>>) {
  const profile = await prisma.influencerProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new Error('Influencer profile not found for this user.');
  }
  return prisma.influencerProfile.update({
    where: { userId },
    data: data,
  });
}

export async function addInfluencerSocialLink(influencerProfileId: string, platform: SocialPlatform, url: string, handle?: string) {
  return prisma.socialLink.create({
    data: {
      influencerProfileId,
      platform,
      url,
      handle,
    },
  });
}

export async function updateInfluencerSocialLink(socialLinkId: string, influencerProfileId: string, data: Partial<{ platform: SocialPlatform, url: string, handle: string }>) {
  const link = await prisma.socialLink.findUnique({ where: { id: socialLinkId } });
  if (!link || link.influencerProfileId !== influencerProfileId) {
    throw new Error('Social link not found or unauthorized.');
  }
  return prisma.socialLink.update({
    where: { id: socialLinkId },
    data,
  });
}

export async function deleteInfluencerSocialLink(socialLinkId: string, influencerProfileId: string) {
  const link = await prisma.socialLink.findUnique({ where: { id: socialLinkId } });
  if (!link || link.influencerProfileId !== influencerProfileId) {
    throw new Error('Social link not found or unauthorized.');
  }
  await prisma.socialLink.delete({ where: { id: socialLinkId } });
  return { message: 'Social link deleted.' };
}
```

**2.6 Backend Routes (Hono.js)**

**filepath: `src/routes/auth.ts`**

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { UserRole } from '@prisma/client';
import {
  registerUser,
  loginUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
} from '../services/auth';

const auth = new Hono();

// Schemas for request bodies
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).default(UserRole.INFLUENCER),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6),
});

// POST /auth/register
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, role } = c.req.valid('json');
  try {
    const user = await registerUser(email, password, role);
    return c.json({ message: 'User registered successfully. Please verify your email.', user });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// POST /auth/login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  try {
    const { token, user } = await loginUser(email, password);
    return c.json({ message: 'Login successful', token, user });
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

// GET /auth/verify-email?token=<token>
auth.get('/verify-email', async (c) => {
  const token = c.req.query('token');
  if (!token) {
    return c.json({ error: 'Missing verification token.' }, 400);
  }
  try {
    const result = await verifyEmail(token);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// POST /auth/forgot-password
auth.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json');
  try {
    const result = await requestPasswordReset(email);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500); // Internal server error if email service fails
  }
});

// POST /auth/reset-password
auth.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  const { token, newPassword } = c.req.valid('json');
  try {
    const result = await resetPassword(token, newPassword);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

export default auth;
```

**filepath: `src/routes/users.ts`**

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, AuthContext, authorize } from '../middlewares/auth';
import { getUserProfile, updateBrandProfile, updateInfluencerProfile, addInfluencerSocialLink, updateInfluencerSocialLink, deleteInfluencerSocialLink } from '../services/user';
import { UserRole, SocialPlatform } from '@prisma/client';

const users = new Hono();

// Apply authMiddleware to all routes in this file
users.use(authMiddleware);

// GET /users/me/profile
users.get('/me/profile', async (c) => {
  const user = c.get('user') as AuthContext['user'];
  try {
    const profile = await getUserProfile(user.id, user.role);
    return c.json(profile);
  } catch (error: any) {
    return c.json({ error: error.message }, 404);
  }
});

// Schemas for profile updates
const updateBrandProfileSchema = z.object({
  companyName: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  brandGuidelinesUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  logoUrl: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

const updateInfluencerProfileSchema = z.object({
  bio: z.string().optional(),
  niche: z.string().optional(),
  profilePictureUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  location: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

const socialLinkSchema = z.object({
  platform: z.nativeEnum(SocialPlatform),
  url: z.string().url(),
  handle: z.string().optional(),
});

// PUT /users/me/profile/brand (only for Brands)
users.put('/me/profile/brand', authorize(UserRole.BRAND), zValidator('json', updateBrandProfileSchema), async (c) => {
  const user = c.get('user') as AuthContext['user'];
  const data = c.req.valid('json');
  try {
    const updatedProfile = await updateBrandProfile(user.id, data);
    return c.json({ message: 'Brand profile updated successfully.', profile: updatedProfile });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// PUT /users/me/profile/influencer (only for Influencers)
users.put('/me/profile/influencer', authorize(UserRole.INFLUENCER), zValidator('json', updateInfluencerProfileSchema), async (c) => {
  const user = c.get('user') as AuthContext['user'];
  const data = c.req.valid('json');
  try {
    const updatedProfile = await updateInfluencerProfile(user.id, data);
    return c.json({ message: 'Influencer profile updated successfully.', profile: updatedProfile });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// POST /users/me/profile/influencer/social-links (only for Influencers)
users.post('/me/profile/influencer/social-links', authorize(UserRole.INFLUENCER), zValidator('json', socialLinkSchema), async (c) => {
  const user = c.get('user') as AuthContext['user'];
  const { platform, url, handle } = c.req.valid('json');
  try {
    const influencerProfile = await prisma.influencerProfile.findUnique({where: {userId: user.id}})
    if (!influencerProfile) {
      return c.json({ error: "Influencer profile not found for this user." }, 404);
    }
    const newLink = await addInfluencerSocialLink(influencerProfile.id, platform, url, handle);
    return c.json({ message: 'Social link added successfully.', link: newLink }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// PUT /users/me/profile/influencer/social-links/:id (only for Influencers)
users.put('/me/profile/influencer/social-links/:linkId', authorize(UserRole.INFLUENCER), zValidator('json', socialLinkSchema.partial()), async (c) => {
  const user = c.get('user') as AuthContext['user'];
  const linkId = c.req.param('linkId');
  const data = c.req.valid('json');
  try {
    const influencerProfile = await prisma.influencerProfile.findUnique({where: {userId: user.id}})
    if (!influencerProfile) {
      return c.json({ error: "Influencer profile not found for this user." }, 404);
    }
    const updatedLink = await updateInfluencerSocialLink(linkId, influencerProfile.id, data);
    return c.json({ message: 'Social link updated successfully.', link: updatedLink });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// DELETE /users/me/profile/influencer/social-links/:id (only for Influencers)
users.delete('/me/profile/influencer/social-links/:linkId', authorize(UserRole.INFLUENCER), async (c) => {
  const user = c.get('user') as AuthContext['user'];
  const linkId = c.req.param('linkId');
  try {
    const influencerProfile = await prisma.influencerProfile.findUnique({where: {userId: user.id}})
    if (!influencerProfile) {
      return c.json({ error: "Influencer profile not found for this user." }, 404);
    }
    await deleteInfluencerSocialLink(linkId, influencerProfile.id);
    return c.json({ message: 'Social link deleted successfully.' }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

export default users;
```

**2.7 Main Hono Application**

**filepath: `src/index.ts`**

```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { UserRole } from '@prisma/client'; // Import UserRole for ContextVariableMap

import authRoutes from './routes/auth';
import userRoutes from './routes/users';

// Augment Hono's ContextVariableMap to include our custom user object
declare module 'hono' {
  interface ContextVariableMap {
    user: {
      id: string;
      email: string;
      role: UserRole;
      isEmailVerified: boolean;
    };
  }
}

const app = new Hono();

// Middlewares
app.use(logger()); // Logging requests
app.use(cors({ // Enable CORS for frontend development
  origin: ['http://localhost:3000'], // Adjust for your frontend URL
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Route registrations
app.route('/auth', authRoutes);
app.route('/users', userRoutes);

// Basic health check
app.get('/', (c) => c.text('Wellfluence Backend API is running!'));

// Global error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;
```
**การรัน Backend:**
ติดตั้ง Dependencies:
```bash
npm init -y
npm install hono @hono/zod-validator zod @prisma/client bcryptjs jsonwebtoken
npm install -D typescript @types/node @types/bcryptjs @types/jsonwebtoken prisma ts-node-dev
```
สร้างไฟล์ `tsconfig.json` และ `package.json` (เพิ่ม script `start:dev`)
```json
// package.json
{
  "name": "wellfluence-backend",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.ts",
  "scripts": {
    "start:dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "prisma:migrate": "npx prisma migrate dev --name",
    "prisma:generate": "npx prisma generate",
    "build": "tsc"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@hono/zod-validator": "^0.2.2",
    "@prisma/client": "^5.12.1",
    "bcryptjs": "^2.4.3",
    "hono": "^4.2.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.12.7",
    "prisma": "^5.12.1",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```
สร้างไฟล์ `.env` ที่ root ของโปรเจกต์
```
DATABASE_URL="postgresql://user:password@localhost:5432/wellfluence_db"
JWT_SECRET="your_super_secret_jwt_key_please_change_me_in_prod"
```
แล้วรัน `npm run start:dev`

---

### **3. Frontend (Next.js + TypeScript)**

เราจะสร้างหน้าเว็บและคอมโพเนนต์ที่จำเป็นสำหรับการลงทะเบียน, เข้าสู่ระบบ, การยืนยันอีเมล, การรีเซ็ตรหัสผ่าน และการจัดการโปรไฟล์พื้นฐาน

**โครงสร้างไฟล์ Frontend โดยประมาณ:**

```
wellfluence-frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx          // Homepage (redirect to login/dashboard)
│   ├── register/
│   │   └── page.tsx      // Registration page
│   ├── login/
│   │   └── page.tsx      // Login page
│   ├── forgot-password/
│   │   └── page.tsx      // Forgot password page
│   ├── reset-password/
│   │   └── page.tsx      // Reset password page
│   ├── verify-email/
│   │   └── page.tsx      // Email verification result page
│   ├── dashboard/
│   │   └── page.tsx      // Basic authenticated dashboard
│   └── profile/
│       └── edit/
│           └── page.tsx  // Profile editing page
├── components/
│   ├── auth/
│   │   ├── RegisterForm.tsx
│   │   ├── LoginForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── profile/
│   │   ├── BrandProfileForm.tsx
│   │   ├── InfluencerProfileForm.tsx
│   │   └── SocialLinksManager.tsx
│   └── common/
│       └── Button.tsx
│       └── Input.tsx
│       └── LoadingSpinner.tsx
├── hooks/
│   └── useAuth.ts          // Context/hook for authentication state
├── lib/
│   ├── api.ts              // API client utility
│   └── auth.ts             // Auth helper functions (token storage)
└── types/
    └── index.ts            // Type declarations
```

**3.1 API Client Utility**

**filepath: `wellfluence-frontend/lib/api.ts`**

```typescript
// For simplicity, we'll use 'fetch' directly. Consider Axios or a more robust solution for larger apps.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'; // Make sure this matches your Hono port

export async function callApi<T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'Something went wrong');
  }

  return response.json();
}
```
**หมายเหตุ:** เพิ่ม `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` ในไฟล์ `.env.local` ของ Next.js project.

**3.2 Auth Helper Functions & Context (Simplified)**

For a full AuthContext with React Context API, it would involve more setup. For this sprint, I'll provide basic functions for storing/retrieving tokens and user info from `localStorage`.

**filepath: `wellfluence-frontend/lib/auth.ts`**

```typescript
import { UserRole } from '../types'; // Define UserRole in types/index.ts

const TOKEN_KEY = 'wellfluence_token';
const USER_KEY = 'wellfluence_user';

export interface UserInfo {
  id: string;
  email: string;
  role: UserRole;
}

export function saveAuthData(token: string, user: UserInfo) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAuthToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}

export function getAuthUser(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// A simple hook to get auth status (can be expanded to use React Context)
export const useAuthStatus = () => {
  const token = getAuthToken();
  const user = getAuthUser();
  return { isAuthenticated: !!token && !!user, user, token };
};
```

**filepath: `wellfluence-frontend/types/index.ts`**

```typescript
export enum UserRole {
  BRAND = 'BRAND',
  INFLUENCER = 'INFLUENCER',
  ADMIN = 'ADMIN',
}

export enum SocialPlatform {
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  YOUTUBE = 'YOUTUBE',
  FACEBOOK = 'FACEBOOK',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfile {
  id: string;
  userId: string;
  companyName: string;
  description?: string;
  website?: string;
  brandGuidelinesUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface SocialLink {
  id: string;
  influencerProfileId: string;
  platform: SocialPlatform;
  url: string;
  handle?: string;
}

export interface InfluencerProfile {
  id: string;
  userId: string;
  bio?: string;
  niche?: string;
  profilePictureUrl?: string;
  portfolioUrl?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks: SocialLink[];
}
```

**3.3 Reusable UI Components (Simplified)**

**filepath: `wellfluence-frontend/components/common/Input.tsx`**

```tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        {...props}
        className={`mt-1 block w-full px-3 py-2 border ${
          error ? 'border-red-500' : 'border-gray-300'
        } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
```

**filepath: `wellfluence-frontend/components/common/Button.tsx`**

```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  ...props
}) => {
  const baseClasses = 'px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    primary: 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:ring-indigo-500',
    danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${variantClasses[variant]} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={loading || props.disabled}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
```

**3.4 Auth Forms**

**filepath: `wellfluence-frontend/components/auth/RegisterForm.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { callApi } from '../../lib/api';
import Input from '../common/Input';
import Button from '../common/Button';
import { UserRole } from '../../types';
import Link from 'next/link';

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.INFLUENCER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await callApi('/auth/register', 'POST', { email, password, role });
      setSuccessMessage('ลงทะเบียนสำเร็จ! โปรดยืนยันอีเมลของคุณ');
      // Optionally redirect to a verification pending page or login
      // router.push('/login');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 text-center">ลงทะเบียน</h2>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}

      <Input
        label="อีเมล"
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="รหัสผ่าน"
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        label="ยืนยันรหัสผ่าน"
        id="confirmPassword"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          คุณคือ?
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value={UserRole.INFLUENCER}>อินฟลูเอนเซอร์</option>
          <option value={UserRole.BRAND}>แบรนด์</option>
        </select>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        ลงทะเบียน
      </Button>
      <p className="mt-4 text-center text-sm text-gray-600">
        มีบัญชีอยู่แล้ว?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
```

**filepath: `wellfluence-frontend/components/auth/LoginForm.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { callApi } from '../../lib/api';
import { saveAuthData } from '../../lib/auth';
import Input from '../common/Input';
import Button from '../common/Button';
import Link from 'next/link';

const LoginForm: React.FC = () => {
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
      const response = await callApi<{ token: string; user: any }>('/auth/login', 'POST', { email, password });
      saveAuthData(response.token, response.user);
      router.push('/dashboard'); // Redirect to dashboard after successful login
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 text-center">เข้าสู่ระบบ</h2>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <Input
        label="อีเมล"
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="รหัสผ่าน"
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div className="text-sm text-right">
        <Link
          href="/forgot-password"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          ลืมรหัสผ่าน?
        </Link>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        เข้าสู่ระบบ
      </Button>
      <p className="mt-4 text-center text-sm text-gray-600">
        ยังไม่มีบัญชี?{' '}
        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          ลงทะเบียน
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
```

**filepath: `wellfluence-frontend/components/auth/ForgotPasswordForm.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { callApi } from '../../lib/api';
import Input from '../common/Input';
import Button from '../common/Button';
import Link from 'next/link';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await callApi('/auth/forgot-password', 'POST', { email });
      setSuccessMessage('หากมีบัญชีที่ลงทะเบียนด้วยอีเมลนี้ ลิงก์รีเซ็ตรหัสผ่านจะถูกส่งไปให้');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งคำขอ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 text-center">ลืมรหัสผ่าน</h2>
      <p className="text-sm text-gray-600 text-center">
        กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่าน
      </p>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}

      <Input
        label="อีเมล"
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Button type="submit" loading={loading} className="w-full">
        ส่งลิงก์รีเซ็ต
      </Button>
      <p className="mt-4 text-center text-sm text-gray-600">
        กลับไป{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;
```

**filepath: `wellfluence-frontend/components/auth/ResetPasswordForm.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { callApi } from '../../lib/api';
import Input from '../common/Input';
import Button from '../common/Button';
import Link from 'next/link';

const ResetPasswordForm: React.FC = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('ไม่พบ Token สำหรับรีเซ็ตรหัสผ่าน');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await callApi('/auth/reset-password', 'POST', { token, newPassword });
      setSuccessMessage('รีเซ็ตรหัสผ่านสำเร็จ คุณสามารถเข้าสู่ระบบได้แล้ว');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h2>
        <p className="text-gray-600 mb-4">
          โปรดกลับไปที่หน้าลืมรหัสผ่านเพื่อขอลิงก์ใหม่
        </p>
        <Link href="/forgot-password">
          <Button>ขอลิงก์ใหม่</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 text-center">ตั้งรหัสผ่านใหม่</h2>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}

      <Input
        label="รหัสผ่านใหม่"
        id="newPassword"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <Input
        label="ยืนยันรหัสผ่านใหม่"
        id="confirmNewPassword"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <Button type="submit" loading={loading} className="w-full">
        ตั้งรหัสผ่านใหม่
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
```

**3.5 Profile Forms**

**filepath: `wellfluence-frontend/components/profile/BrandProfileForm.tsx`**

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { callApi } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';
import { BrandProfile as TBrandProfile } from '../../types';

interface BrandProfileFormProps {
  initialData?: TBrandProfile;
  onUpdateSuccess: (profile: TBrandProfile) => void;
}

const BrandProfileForm: React.FC<BrandProfileFormProps> = ({ initialData, onUpdateSuccess }) => {
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [brandGuidelinesUrl, setBrandGuidelinesUrl] = useState(initialData?.brandGuidelinesUrl || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone || '');
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [country, setCountry