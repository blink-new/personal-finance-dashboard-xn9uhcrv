import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createLoanSchema = z.object({
  loanName: z.string().min(1),
  principalAmount: z.number().positive(),
  outstandingAmount: z.number().positive(),
  interestRate: z.number().positive(),
  emiAmount: z.number().positive(),
  tenureMonths: z.number().positive().int(),
  startDate: z.string().datetime(),
});

const updateLoanSchema = createLoanSchema.partial();

// Get all loans for user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(loans);
  } catch (error) {
    next(error);
  }
});

// Get single loan
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const loan = await prisma.loan.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json(loan);
  } catch (error) {
    next(error);
  }
});

// Create new loan
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = createLoanSchema.parse(req.body);

    const loan = await prisma.loan.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        userId: req.user!.userId,
      },
    });

    res.status(201).json({
      message: 'Loan created successfully',
      loan,
    });
  } catch (error) {
    next(error);
  }
});

// Update loan
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = updateLoanSchema.parse(req.body);

    const loan = await prisma.loan.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
      },
    });

    if (loan.count === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const updatedLoan = await prisma.loan.findUnique({
      where: { id: req.params.id },
    });

    res.json({
      message: 'Loan updated successfully',
      loan: updatedLoan,
    });
  } catch (error) {
    next(error);
  }
});

// Delete loan
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const loan = await prisma.loan.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (loan.count === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Calculate prepayment impact
router.post('/:id/prepayment', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { prepaymentAmount } = z.object({
      prepaymentAmount: z.number().positive(),
    }).parse(req.body);

    const loan = await prisma.loan.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Calculate prepayment impact
    const monthlyRate = loan.interestRate / 100 / 12;
    const currentOutstanding = loan.outstandingAmount;
    const newOutstanding = Math.max(0, currentOutstanding - prepaymentAmount);
    
    // Calculate remaining tenure for current loan
    const currentTenure = Math.ceil(
      Math.log(1 + (currentOutstanding * monthlyRate) / loan.emiAmount) / 
      Math.log(1 + monthlyRate)
    );
    
    // Calculate new tenure after prepayment
    const newTenure = newOutstanding > 0 ? Math.ceil(
      Math.log(1 + (newOutstanding * monthlyRate) / loan.emiAmount) / 
      Math.log(1 + monthlyRate)
    ) : 0;

    const tenureReduction = currentTenure - newTenure;
    const interestSaved = tenureReduction * loan.emiAmount - (currentOutstanding - newOutstanding);

    res.json({
      currentOutstanding,
      newOutstanding,
      prepaymentAmount,
      tenureReduction,
      interestSaved: Math.max(0, interestSaved),
      newTenureMonths: newTenure,
    });
  } catch (error) {
    next(error);
  }
});

export default router;