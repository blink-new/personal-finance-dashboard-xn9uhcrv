import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createSipSchema = z.object({
  sipName: z.string().min(1),
  category: z.enum(['LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'DEBT', 'HYBRID']),
  monthlyAmount: z.number().positive(),
  currentValue: z.number().min(0),
  allocationPercentage: z.number().min(0).max(100),
  expectedReturnRate: z.number().positive(),
  startDate: z.string().datetime(),
  isActive: z.boolean().optional(),
});

const updateSipSchema = createSipSchema.partial();

const monthlyInvestmentSchema = z.object({
  sipId: z.string(),
  amount: z.number().positive(),
  investmentDate: z.string().datetime(),
});

// Get all SIP investments for user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const investments = await prisma.sipInvestment.findMany({
      where: { userId: req.user!.userId },
      include: {
        monthlyInvestments: {
          orderBy: { investmentDate: 'desc' },
          take: 12, // Last 12 months
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(investments);
  } catch (error) {
    next(error);
  }
});

// Get single SIP investment
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const investment = await prisma.sipInvestment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      include: {
        monthlyInvestments: {
          orderBy: { investmentDate: 'desc' },
        },
      },
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    res.json(investment);
  } catch (error) {
    next(error);
  }
});

// Create new SIP investment
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = createSipSchema.parse(req.body);

    const investment = await prisma.sipInvestment.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        userId: req.user!.userId,
      },
    });

    res.status(201).json({
      message: 'SIP investment created successfully',
      investment,
    });
  } catch (error) {
    next(error);
  }
});

// Update SIP investment
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = updateSipSchema.parse(req.body);

    const investment = await prisma.sipInvestment.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
      },
    });

    if (investment.count === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    const updatedInvestment = await prisma.sipInvestment.findUnique({
      where: { id: req.params.id },
    });

    res.json({
      message: 'Investment updated successfully',
      investment: updatedInvestment,
    });
  } catch (error) {
    next(error);
  }
});

// Delete SIP investment
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const investment = await prisma.sipInvestment.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (investment.count === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add monthly investment
router.post('/monthly', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = monthlyInvestmentSchema.parse(req.body);

    // Verify SIP belongs to user
    const sip = await prisma.sipInvestment.findFirst({
      where: {
        id: data.sipId,
        userId: req.user!.userId,
      },
    });

    if (!sip) {
      return res.status(404).json({ error: 'SIP investment not found' });
    }

    const monthlyInvestment = await prisma.monthlyInvestment.create({
      data: {
        ...data,
        investmentDate: new Date(data.investmentDate),
        userId: req.user!.userId,
      },
    });

    res.status(201).json({
      message: 'Monthly investment recorded successfully',
      monthlyInvestment,
    });
  } catch (error) {
    next(error);
  }
});

// Get monthly investments
router.get('/monthly/:sipId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const monthlyInvestments = await prisma.monthlyInvestment.findMany({
      where: {
        sipId: req.params.sipId,
        userId: req.user!.userId,
      },
      orderBy: { investmentDate: 'desc' },
    });

    res.json(monthlyInvestments);
  } catch (error) {
    next(error);
  }
});

// Calculate portfolio projection
router.get('/portfolio/projection', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const investments = await prisma.sipInvestment.findMany({
      where: { 
        userId: req.user!.userId,
        isActive: true,
      },
      include: {
        monthlyInvestments: true,
      },
    });

    const currentDate = new Date();
    const projectionYears = 10;
    
    let totalCurrentValue = 0;
    let totalMonthlyInvestment = 0;
    let projectedValue = 0;

    investments.forEach(investment => {
      totalCurrentValue += investment.currentValue;
      totalMonthlyInvestment += investment.monthlyAmount;
      
      // Calculate future value using compound interest formula
      const monthlyRate = investment.expectedReturnRate / 100 / 12;
      const months = projectionYears * 12;
      
      // Future value of current investment
      const futureValueCurrent = investment.currentValue * Math.pow(1 + monthlyRate, months);
      
      // Future value of monthly SIPs
      const futureValueSip = investment.monthlyAmount * 
        ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      
      projectedValue += futureValueCurrent + futureValueSip;
    });

    const totalInvestmentOver10Years = totalMonthlyInvestment * 12 * projectionYears;
    const expectedGains = projectedValue - totalCurrentValue - totalInvestmentOver10Years;

    res.json({
      currentPortfolioValue: totalCurrentValue,
      monthlyInvestment: totalMonthlyInvestment,
      projectedValue: Math.round(projectedValue),
      totalInvestmentOver10Years,
      expectedGains: Math.round(expectedGains),
      projectionYears,
    });
  } catch (error) {
    next(error);
  }
});

export default router;