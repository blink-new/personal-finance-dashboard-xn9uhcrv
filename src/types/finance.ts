export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'savings' | 'checking' | 'investment' | 'loan';
  balance: number;
  createdAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  name: string;
  principalAmount: number;
  currentOutstanding: number;
  interestRate: number;
  emiAmount: number;
  tenureMonths: number;
  remainingMonths: number;
  startDate: string;
  createdAt: string;
}

export interface SipInvestment {
  id: string;
  userId: string;
  name: string;
  category: 'large_cap' | 'mid_cap' | 'small_cap' | 'debt' | 'hybrid';
  monthlyAmount: number;
  currentValue: number;
  totalInvested: number;
  allocationPercentage: number;
  expectedReturnRate: number;
  createdAt: string;
}

export interface MonthlyInvestment {
  id: string;
  userId: string;
  sipId: string;
  amount: number;
  investmentDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  category: string;
  amount: number;
  description?: string;
  expenseDate: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  month: number;
  year: number;
  totalBudget: number;
  spentAmount: number;
  createdAt: string;
}

export interface FinancialSummary {
  id: string;
  userId: string;
  month: number;
  year: number;
  totalIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  totalInvestments: number;
  emergencyFund: number;
  insurance: number;
  savingsRate: number;
  investmentRate: number;
  healthScore: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  createdAt: string;
}