import { useState, useEffect } from 'react';
import { OverviewCards } from './OverviewCards';
import { useAuth } from '@/hooks/useAuth';
import { loansAPI, investmentsAPI, budgetsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';

interface Loan {
  id: string;
  loanName: string;
  outstandingAmount: number;
  emiAmount: number;
}

interface Investment {
  id: string;
  sipName: string;
  currentValue: number;
}

interface Budget {
  id: string;
  monthlyLimit: number;
  currentSpent: number;
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadFinancialData();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFinancialData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Load loans
      const loansData = await loansAPI.getAll();
      setLoans(loansData);

      // Load SIP investments
      const investmentsData = await investmentsAPI.getAll();
      setInvestments(investmentsData);

      // Load current month budget
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const budgetData = await budgetsAPI.getAll(currentMonth, currentYear);
      
      if (budgetData.length > 0) {
        // Find total budget or create one
        const totalBudget = budgetData.find((b: any) => b.category === 'total');
        if (totalBudget) {
          setBudget(totalBudget);
        } else {
          // Create default budget if none exists
          const defaultBudget = await budgetsAPI.create({
            category: 'total',
            monthlyLimit: 30000,
            currentSpent: 0,
            month: currentMonth,
            year: currentYear
          });
          setBudget(defaultBudget);
        }
      } else {
        // Create default budget if none exists
        const defaultBudget = await budgetsAPI.create({
          category: 'total',
          monthlyLimit: 30000,
          currentSpent: 0,
          month: currentMonth,
          year: currentYear
        });
        setBudget(defaultBudget);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading your financial dashboard...</div>
      </div>
    );
  }

  // Calculate totals
  const totalLoans = loans.reduce((sum, loan) => sum + loan.outstandingAmount, 0);
  const totalEMI = loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const netWorth = totalInvestments - totalLoans;
  const monthlyBudget = budget?.monthlyLimit || 0;
  const spentAmount = budget?.currentSpent || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name || user?.email}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <OverviewCards
        netWorth={netWorth}
        monthlyBudget={monthlyBudget}
        spentAmount={spentAmount}
        totalLoans={totalLoans}
        totalEMI={totalEMI}
        totalInvestments={totalInvestments}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white cursor-pointer hover:from-green-600 hover:to-green-700 transition-colors">
          <h3 className="text-lg font-semibold mb-2">Add Investment</h3>
          <p className="text-green-100 text-sm">Record your monthly SIP investments</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-colors">
          <h3 className="text-lg font-semibold mb-2">Track Expenses</h3>
          <p className="text-blue-100 text-sm">Log your daily expenses</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-colors">
          <h3 className="text-lg font-semibold mb-2">Loan Calculator</h3>
          <p className="text-purple-100 text-sm">Calculate prepayment benefits</p>
        </div>
      </div>

      {/* User Profile Summary */}
      {user && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Your Financial Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Monthly Income</p>
              <p className="text-xl font-semibold text-green-600">
                ₹{user.monthlyIncome?.toLocaleString('en-IN') || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Emergency Fund</p>
              <p className="text-xl font-semibold text-blue-600">
                ₹{user.emergencyFund?.toLocaleString('en-IN') || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Risk Tolerance</p>
              <p className="text-xl font-semibold text-purple-600 capitalize">
                {user.riskTolerance || 'Not set'}
              </p>
            </div>
          </div>
          {user.financialGoals && user.financialGoals.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Financial Goals</p>
              <div className="flex flex-wrap gap-2">
                {user.financialGoals.map((goal, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
                  >
                    {goal.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}