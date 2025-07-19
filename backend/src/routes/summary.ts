import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createSummarySchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  totalIncome: z.number().positive(),
  fixedExpenses: z.number().min(0),
  variableExpenses: z.number().min(0),
  totalInvestments: z.number().min(0),
  emergencyFund: z.number().min(0),
  insurance: z.number().min(0),
});

// Get financial summary for specific month/year
router.get('/:year/:month', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { year, month } = req.params;
    
    const summary = await prisma.financialSummary.findFirst({
      where: {
        userId: req.user!.userId,
        month: Number(month),
        year: Number(year),
      },
    });

    if (!summary) {
      return res.status(404).json({ error: 'Financial summary not found' });
    }

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// Get current month summary or generate it
router.get('/current', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Try to find existing summary
    let summary = await prisma.financialSummary.findFirst({
      where: {
        userId: req.user!.userId,
        month: currentMonth,
        year: currentYear,
      },
    });

    // If no summary exists, generate one
    if (!summary) {
      summary = await generateMonthlySummary(req.user!.userId, currentMonth, currentYear);
    }

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// Create or update financial summary
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = createSummarySchema.parse(req.body);

    // Calculate rates and health score
    const savingsRate = ((data.totalIncome - data.fixedExpenses - data.variableExpenses) / data.totalIncome) * 100;
    const investmentRate = (data.totalInvestments / data.totalIncome) * 100;
    const healthScore = calculateHealthScore(savingsRate, investmentRate, data.emergencyFund, data.totalIncome);

    const summary = await prisma.financialSummary.upsert({
      where: {
        userId_month_year: {
          userId: req.user!.userId,
          month: data.month,
          year: data.year,
        },
      },
      update: {
        ...data,
        savingsRate,
        investmentRate,
        healthScore,
      },
      create: {
        ...data,
        userId: req.user!.userId,
        savingsRate,
        investmentRate,
        healthScore,
      },
    });

    res.json({
      message: 'Financial summary saved successfully',
      summary,
    });
  } catch (error) {
    next(error);
  }
});

// Generate summary for specific month
router.post('/generate/:year/:month', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { year, month } = req.params;
    
    const summary = await generateMonthlySummary(
      req.user!.userId, 
      Number(month), 
      Number(year)
    );

    res.json({
      message: 'Financial summary generated successfully',
      summary,
    });
  } catch (error) {
    next(error);
  }
});

// Get all summaries for user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const summaries = await prisma.financialSummary.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    res.json(summaries);
  } catch (error) {
    next(error);
  }
});

// Helper function to generate monthly summary
async function generateMonthlySummary(userId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Get user profile for income
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyIncome: true, emergencyFund: true },
  });

  const totalIncome = user?.monthlyIncome || 0;
  const emergencyFund = user?.emergencyFund || 0;

  // Get expenses for the month
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      expenseDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const fixedExpenses = expenses
    .filter(expense => expense.isFixed)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const variableExpenses = expenses
    .filter(expense => !expense.isFixed)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Get investments for the month
  const monthlyInvestments = await prisma.monthlyInvestment.findMany({
    where: {
      userId,
      investmentDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalInvestments = monthlyInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  // Get loans for EMI calculation
  const loans = await prisma.loan.findMany({
    where: { userId },
  });

  const loanEMIs = loans.reduce((sum, loan) => sum + loan.emiAmount, 0);

  // Estimate insurance (this could be made configurable)
  const insurance = 2000; // Default insurance amount

  // Calculate rates and health score
  const savingsRate = totalIncome > 0 ? ((totalIncome - fixedExpenses - variableExpenses) / totalIncome) * 100 : 0;
  const investmentRate = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;
  const healthScore = calculateHealthScore(savingsRate, investmentRate, emergencyFund, totalIncome);

  // Create or update summary
  const summary = await prisma.financialSummary.upsert({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    update: {
      totalIncome,
      fixedExpenses: fixedExpenses + loanEMIs,
      variableExpenses,
      totalInvestments,
      emergencyFund,
      insurance,
      savingsRate,
      investmentRate,
      healthScore,
    },
    create: {
      userId,
      month,
      year,
      totalIncome,
      fixedExpenses: fixedExpenses + loanEMIs,
      variableExpenses,
      totalInvestments,
      emergencyFund,
      insurance,
      savingsRate,
      investmentRate,
      healthScore,
    },
  });

  return summary;
}

// Helper function to calculate health score
function calculateHealthScore(savingsRate: number, investmentRate: number, emergencyFund: number, monthlyIncome: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
  let score = 0;

  // Savings rate scoring (0-30 points)
  if (savingsRate >= 20) score += 30;
  else if (savingsRate >= 15) score += 25;
  else if (savingsRate >= 10) score += 20;
  else if (savingsRate >= 5) score += 15;
  else if (savingsRate >= 0) score += 10;

  // Investment rate scoring (0-30 points)
  if (investmentRate >= 20) score += 30;
  else if (investmentRate >= 15) score += 25;
  else if (investmentRate >= 10) score += 20;
  else if (investmentRate >= 5) score += 15;

  // Emergency fund scoring (0-40 points)
  const emergencyFundMonths = monthlyIncome > 0 ? emergencyFund / monthlyIncome : 0;
  if (emergencyFundMonths >= 6) score += 40;
  else if (emergencyFundMonths >= 3) score += 30;
  else if (emergencyFundMonths >= 1) score += 20;
  else if (emergencyFundMonths > 0) score += 10;

  // Determine health score
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'FAIR';
  return 'POOR';
}

export default router;