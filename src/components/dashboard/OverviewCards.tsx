import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Target, PiggyBank } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OverviewCardsProps {
  netWorth: number
  monthlyBudget: number
  spentAmount: number
  totalLoans: number
  totalEMI: number
  totalInvestments: number
}

export function OverviewCards({
  netWorth,
  monthlyBudget,
  spentAmount,
  totalLoans,
  totalEMI,
  totalInvestments
}: OverviewCardsProps) {
  const budgetProgress = monthlyBudget > 0 ? (spentAmount / monthlyBudget) * 100 : 0
  const remainingBudget = monthlyBudget - spentAmount

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Net Worth */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Net Worth</CardTitle>
          {netWorth >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold",
            netWorth >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {formatCurrency(netWorth)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {netWorth >= 0 ? "Positive" : "Negative"} net worth
          </p>
        </CardContent>
      </Card>

      {/* Monthly Budget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Monthly Budget</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(spentAmount)} / {formatCurrency(monthlyBudget)}
          </div>
          <div className="mt-2 space-y-2">
            <Progress value={budgetProgress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Spent: {budgetProgress.toFixed(1)}%</span>
              <span>Remaining: {formatCurrency(remainingBudget)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Loans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Loan Outstanding</CardTitle>
          <CreditCard className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalLoans)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            EMI: {formatCurrency(totalEMI)}/month
          </p>
        </CardContent>
      </Card>

      {/* Total Investments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Investments</CardTitle>
          <PiggyBank className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalInvestments)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Portfolio value
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Quick Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(totalInvestments - totalLoans)}
              </div>
              <p className="text-xs text-gray-500">Investment vs Debt</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {((totalInvestments / (totalInvestments + totalLoans)) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">Investment Ratio</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}