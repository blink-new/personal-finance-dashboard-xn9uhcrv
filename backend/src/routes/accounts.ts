import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['SAVINGS', 'CHECKING', 'INVESTMENT', 'LOAN']),
  balance: z.number(),
});

const updateAccountSchema = createAccountSchema.partial();

// Get all accounts for user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(accounts);
  } catch (error) {
    next(error);
  }
});

// Get single account
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    next(error);
  }
});

// Create new account
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = createAccountSchema.parse(req.body);

    const account = await prisma.account.create({
      data: {
        ...data,
        userId: req.user!.userId,
      },
    });

    res.status(201).json({
      message: 'Account created successfully',
      account,
    });
  } catch (error) {
    next(error);
  }
});

// Update account
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = updateAccountSchema.parse(req.body);

    const account = await prisma.account.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      data,
    });

    if (account.count === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const updatedAccount = await prisma.account.findUnique({
      where: { id: req.params.id },
    });

    res.json({
      message: 'Account updated successfully',
      account: updatedAccount,
    });
  } catch (error) {
    next(error);
  }
});

// Delete account
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const account = await prisma.account.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (account.count === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;