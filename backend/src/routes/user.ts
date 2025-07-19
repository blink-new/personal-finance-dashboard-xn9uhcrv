import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const onboardingSchema = z.object({
  monthlyIncome: z.number().positive(),
  emergencyFund: z.number().min(0),
  riskTolerance: z.enum(['low', 'medium', 'high']),
  financialGoals: z.array(z.string()),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  monthlyIncome: z.number().positive().optional(),
  emergencyFund: z.number().min(0).optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
  financialGoals: z.array(z.string()).optional(),
});

// Get current user profile
router.get('/profile', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        monthlyIncome: true,
        emergencyFund: true,
        riskTolerance: true,
        financialGoals: true,
        isOnboardingComplete: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Complete onboarding
router.post('/onboarding', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = onboardingSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...data,
        isOnboardingComplete: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        monthlyIncome: true,
        emergencyFund: true,
        riskTolerance: true,
        financialGoals: true,
        isOnboardingComplete: true,
      },
    });

    res.json({
      message: 'Onboarding completed successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        monthlyIncome: true,
        emergencyFund: true,
        riskTolerance: true,
        financialGoals: true,
        isOnboardingComplete: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;