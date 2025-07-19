import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createBudgetSchema = z.object({
  category: z.string().min(1),
  monthlyLimit: z.number().positive(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
});

const updateBudgetSchema = z.object({
  monthlyLimit: z.number().positive().optional(),
  currentSpent: z.number().min(0).optional(),
});

// Get all budgets for user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { month, year } = req.query;
    
    const whereClause: any = { userId: req.user!.userId };
    
    if (month && year) {
      whereClause.month = Number(month);
      whereClause.year = Number(year);
    }

    const budgets = await prisma.budget.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { category: 'asc' }],
    });

    res.json(budgets);
  } catch (error) {
    next(error);
  }
});

// Get current month budget summary
router.get('/current', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.user!.userId,
        month: currentMonth,
        year: currentYear,
      },
    });

    const totalBudget = budgets.find(b => b.category === 'total');
    const categoryBudgets = budgets.filter(b => b.category !== 'total');

    res.json({
      totalBudget,
      categoryBudgets,
      month: currentMonth,
      year: currentYear,
    });
  } catch (error) {
    next(error);
  }
});

// Get single budget
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const budget = await prisma.budget.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    next(error);
  }
});

// Create new budget
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = createBudgetSchema.parse(req.body);

    // Check if budget already exists for this category, month, and year
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: req.user!.userId,
        category: data.category,
        month: data.month,
        year: data.year,
      },
    });

    if (existingBudget) {
      return res.status(400).json({ 
        error: 'Budget already exists for this category and period' 
      });
    }

    const budget = await prisma.budget.create({
      data: {
        ...data,
        userId: req.user!.userId,
      },
    });

    res.status(201).json({
      message: 'Budget created successfully',
      budget,
    });
  } catch (error) {
    next(error);
  }
});

// Update budget
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = updateBudgetSchema.parse(req.body);

    const budget = await prisma.budget.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      data,
    });

    if (budget.count === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const updatedBudget = await prisma.budget.findUnique({
      where: { id: req.params.id },
    });

    res.json({
      message: 'Budget updated successfully',
      budget: updatedBudget,
    });
  } catch (error) {
    next(error);
  }
});

// Delete budget
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const budget = await prisma.budget.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (budget.count === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Initialize default budgets for current month
router.post('/initialize', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Check if budgets already exist
    const existingBudgets = await prisma.budget.findMany({
      where: {
        userId: req.user!.userId,
        month: currentMonth,
        year: currentYear,
      },
    });

    if (existingBudgets.length > 0) {
      return res.status(400).json({ 
        error: 'Budgets already exist for current month' 
      });
    }

    // Create default budgets
    const defaultBudgets = [
      { category: 'total', monthlyLimit: 30000 },
      { category: 'food', monthlyLimit: 8000 },
      { category: 'transportation', monthlyLimit: 3000 },
      { category: 'entertainment', monthlyLimit: 2000 },
      { category: 'utilities', monthlyLimit: 2000 },
      { category: 'shopping', monthlyLimit: 5000 },
      { category: 'healthcare', monthlyLimit: 2000 },
      { category: 'miscellaneous', monthlyLimit: 8000 },
    ];

    const budgets = await Promise.all(
      defaultBudgets.map(budget =>
        prisma.budget.create({
          data: {
            ...budget,
            userId: req.user!.userId,
            month: currentMonth,
            year: currentYear,
          },
        })
      )
    );

    res.status(201).json({
      message: 'Default budgets created successfully',
      budgets,
    });
  } catch (error) {
    next(error);
  }
});

export default router;