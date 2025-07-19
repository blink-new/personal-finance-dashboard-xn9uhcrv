import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().optional(),
  expenseDate: z.string().datetime(),
  isFixed: z.boolean().optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

// Get all expenses for user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { month, year, category } = req.query;
    
    const whereClause: any = { userId: req.user!.userId };
    
    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      
      whereClause.expenseDate = {
        gte: startDate,
        lte: endDate,
      };
    }
    
    // Filter by category if provided
    if (category) {
      whereClause.category = category;
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { expenseDate: 'desc' },
    });

    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// Get expense categories for user
router.get('/categories', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const categories = await prisma.expense.findMany({
      where: { userId: req.user!.userId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    res.json(categories.map(c => c.category));
  } catch (error) {
    next(error);
  }
});

// Get monthly expense summary
router.get('/summary/:year/:month', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { year, month } = req.params;
    
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.user!.userId,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by category
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const fixedExpenses = expenses
      .filter(expense => expense.isFixed)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const variableExpenses = totalExpenses - fixedExpenses;

    res.json({
      totalExpenses,
      fixedExpenses,
      variableExpenses,
      categoryTotals,
      expenseCount: expenses.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get single expense
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// Create new expense
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = createExpenseSchema.parse(req.body);

    const expense = await prisma.expense.create({
      data: {
        ...data,
        expenseDate: new Date(data.expenseDate),
        userId: req.user!.userId,
      },
    });

    // Update budget if exists
    const expenseDate = new Date(data.expenseDate);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    await prisma.budget.updateMany({
      where: {
        userId: req.user!.userId,
        category: data.category,
        month,
        year,
      },
      data: {
        currentSpent: {
          increment: data.amount,
        },
      },
    });

    // Also update total budget
    await prisma.budget.updateMany({
      where: {
        userId: req.user!.userId,
        category: 'total',
        month,
        year,
      },
      data: {
        currentSpent: {
          increment: data.amount,
        },
      },
    });

    res.status(201).json({
      message: 'Expense created successfully',
      expense,
    });
  } catch (error) {
    next(error);
  }
});

// Update expense
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = updateExpenseSchema.parse(req.body);

    // Get original expense to calculate budget difference
    const originalExpense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!originalExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.expenseDate && { expenseDate: new Date(data.expenseDate) }),
      },
    });

    // Update budget if amount changed
    if (data.amount && data.amount !== originalExpense.amount) {
      const difference = data.amount - originalExpense.amount;
      const expenseDate = data.expenseDate ? new Date(data.expenseDate) : originalExpense.expenseDate;
      const month = expenseDate.getMonth() + 1;
      const year = expenseDate.getFullYear();

      await prisma.budget.updateMany({
        where: {
          userId: req.user!.userId,
          category: originalExpense.category,
          month,
          year,
        },
        data: {
          currentSpent: {
            increment: difference,
          },
        },
      });

      await prisma.budget.updateMany({
        where: {
          userId: req.user!.userId,
          category: 'total',
          month,
          year,
        },
        data: {
          currentSpent: {
            increment: difference,
          },
        },
      });
    }

    res.json({
      message: 'Expense updated successfully',
      expense,
    });
  } catch (error) {
    next(error);
  }
});

// Delete expense
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await prisma.expense.delete({
      where: { id: req.params.id },
    });

    // Update budget
    const month = expense.expenseDate.getMonth() + 1;
    const year = expense.expenseDate.getFullYear();

    await prisma.budget.updateMany({
      where: {
        userId: req.user!.userId,
        category: expense.category,
        month,
        year,
      },
      data: {
        currentSpent: {
          decrement: expense.amount,
        },
      },
    });

    await prisma.budget.updateMany({
      where: {
        userId: req.user!.userId,
        category: 'total',
        month,
        year,
      },
      data: {
        currentSpent: {
          decrement: expense.amount,
        },
      },
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;