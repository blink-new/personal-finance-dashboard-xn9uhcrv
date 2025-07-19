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
  loanName: string;
  principalAmount: number;
  outstandingAmount: number;
  interestRate: number;
  emiAmount: number;
  tenureMonths: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SipInvestment {
  id: string;
  userId: string;
  sipName: string;
  category: 'large_cap' | 'mid_cap' | 'small_cap' | 'debt' | 'hybrid';
  monthlyAmount: number;
  currentValue: number;
  allocationPercentage: number;
  expectedReturnRate: number;
  startDate: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
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
  amount: number;
  category: string;
  description?: string;
  expenseDate: string;
  isFixed: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  currentSpent: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
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