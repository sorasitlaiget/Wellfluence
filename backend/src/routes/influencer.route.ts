import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../lib/prisma';
import { authMiddleware, influencerAuthMiddleware, adminAuthMiddleware } from '../middleware/auth.middleware';

const influencerRoute = new Hono();

const createInfluencerProfileSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  bio: z.string().max(500).optional(),
  niche: z.string().max(100).optional(),
  contentPillars: z.string().array().optional(),
  baseRate: z.number().positive().optional(),
  mediaKitUrl: z.string().url().optional().nullable(),
  // Audience demographics will be more complex, keeping it simple for v1
});

const updateInfluencerProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  niche: z.string().max(100).optional(),
  contentPillars: z.string().array().optional(),
  baseRate: z.number().positive().optional(),
  mediaKitUrl: z.string().url().optional().nullable(),
  audienceDemographics: z.record(z.string(), z.any()).optional(), // Simple record for now
  isVerified: z.boolean().optional(),
});

// GET /influencers - List all influencers
influencerRoute.get('/', authMiddleware, async (c) => {
  const { page = '1', limit = '10', niche, keyword } = c.req.query();
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (niche) {
    where.niche = { contains: niche, mode: 'insensitive' };
  }
  if (keyword) {
    where.OR = [
      { bio: { contains: keyword, mode: 'insensitive' } },
      { niche: { contains: keyword, mode: 'insensitive' } },
      { contentPillars: { has: keyword } }
    ];
  }

  try {
    const influencers = await prisma.influencerProfile.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        bio: true,
        niche: true,
        contentPillars: true,
        baseRate: true,
        mediaKitUrl: true,
        isVerified: true,
        user: {
          select: {
            id: true,
            email: true,
          }
        },
        socialAccounts: {
          select: {
            platform: true,
            username: true,
            followerCount: true,
            engagementRate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalInfluencers = await prisma.influencerProfile.count({ where });

    return c.json({
      data: influencers,
      pagination: {
        total: totalInfluencers,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalInfluencers / limitNum),
      }
    });
  } catch (error: any) {
    console.error('Error fetching influencers:', error);
    return c.json({ error: 'Failed to fetch influencers', details: error.message }, 500);
  }
});

// GET /influencers/:id - Get single influencer profile
influencerRoute.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();

  try {
    const influencer = await prisma.influencerProfile.findUnique({
      where: { id },
      select: {
        id: true,
        bio: true,
        niche: true,
        contentPillars: true,
        baseRate: true,
        mediaKitUrl: true,
        isVerified: true,
        audienceDemographics: true,
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          }
        },
        socialAccounts: {
          select: {
            platform: true,
            username: true,
            followerCount: true,
            engagementRate: true,
            lastSyncedAt: true
          }
        },
        collaborations: {
          select: {
            id: true,
            status: true,
            campaign: {
              select: { title: true, brandProfile: { select: { name: true } } }
            }
          },
          take: 5, // Show recent collaborations
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!influencer) {
      return c.json({ error: 'Influencer not found' }, 404);
    }
    return c.json(influencer);
  } catch (error: any) {
    console.error('Error fetching influencer:', error);
    return c.json({ error: 'Failed to fetch influencer', details: error.message }, 500);
  }
});

// PUT /influencers/:id - Update influencer profile
influencerRoute.put('/:id', influencerAuthMiddleware, zValidator('json', updateInfluencerProfileSchema), async (c) => {
  const { id } = c.req.param();
  const updateData = c.req.valid('json');
  const jwtPayload = c.get('jwtPayload');

  try {
    const existingInfluencer = await prisma.influencerProfile.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existingInfluencer) {
      return c.json({ error: 'Influencer profile not found' }, 404);
    }

    if (existingInfluencer.userId !== jwtPayload.userId) {
      return c.json({ error: 'Forbidden: You can only update your own profile' }, 403);
    }

    const updatedInfluencer = await prisma.influencerProfile.update({
      where: { id },
      data: updateData,
    });
    return c.json({ message: 'Influencer profile updated successfully', data: updatedInfluencer });
  } catch (error: any) {
    console.error('Error updating influencer profile:', error);
    return c.json({ error: 'Failed to update influencer profile', details: error.message }, 500);
  }
});

// DELETE /influencers/:id - Delete influencer profile (Admin only)
influencerRoute.delete('/:id', adminAuthMiddleware, async (c) => {
  const { id } = c.req.param();

  try {
    const existingInfluencer = await prisma.influencerProfile.findUnique({ where: { id } });
    if (!existingInfluencer) {
      return c.json({ error: 'Influencer profile not found' }, 404);
    }

    // Also delete the associated User to clean up fully
    await prisma.user.delete({ where: { id: existingInfluencer.userId } });

    return c.json({ message: 'Influencer profile and associated user deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting influencer profile:', error);
    return c.json({ error: 'Failed to delete influencer profile', details: error.message }, 500);
  }
});

export { influencerRoute };