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