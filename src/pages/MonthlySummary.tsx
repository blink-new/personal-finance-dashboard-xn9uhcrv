import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PiggyBank,
  Shield,
  Target,
  Calendar
} from 'lucide-react'
import { blink } from '../blink/client'

interface MonthlySummaryData {
  income: number
  fixedExpenses: {
    loanEMIs: number
    sipInvestments: number
    emergencyFund: number
    fixedExpenses: number
    insurance: number
    total: number
  }
  variableExpenses: number
  totalExpenses: number
  savings: number
  savingsRate: number
  investmentRate: number
  financialHealthScore: string
}

export function MonthlySummary() {
  const [data, setData] = useState<MonthlySummaryData>({
    income: 85000, // Default income
    fixedExpenses: {
      loanEMIs: 0,
      sipInvestments: 0,
      emergencyFund: 8000,
      fixedExpenses: 0,
      insurance: 2000,
      total: 0
    },
    variableExpenses: 0,
    totalExpenses: 0,
    savings: 0,
    savingsRate: 0,
    investmentRate: 0,
    financialHealthScore: 'Fair'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMonthlySummary()
  }, [])

  const loadMonthlySummary = async () => {
    try {
      const user = await blink.auth.me()
      
      // Get current month data
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()
      
      // Get loans data for EMI calculation
      const loans = await blink.db.loans.list({
        where: { userId: user.id }
      })
      
      // Get SIP investments for monthly investment calculation
      const sips = await blink.db.sipInvestments.list({
        where: { userId: user.id, isActive: 1 }
      })
      
      // Get current month expenses
      const expenses = await blink.db.expenses.list({
        where: { userId: user.id }
      })
      
      // Filter expenses for current month
      const currentMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.expenseDate)
        return expenseDate.getMonth() + 1 === currentMonth && 
               expenseDate.getFullYear() === currentYear
      })
      
      // Calculate totals
      const loanEMIs = loans.reduce((sum, loan) => sum + Number(loan.emiAmount), 0)
      const sipInvestments = sips.reduce((sum, sip) => sum + Number(sip.monthlyAmount), 0)
      const fixedExpensesAmount = currentMonthExpenses
        .filter(expense => Number(expense.isFixed) > 0)
        .reduce((sum, expense) => sum + Number(expense.amount), 0)
      const variableExpenses = currentMonthExpenses
        .filter(expense => Number(expense.isFixed) === 0)
        .reduce((sum, expense) => sum + Number(expense.amount), 0)
      
      const fixedExpenses = {
        loanEMIs,
        sipInvestments,
        emergencyFund: 8000, // Default emergency fund
        fixedExpenses: fixedExpensesAmount,
        insurance: 2000, // Default insurance
        total: loanEMIs + sipInvestments + 8000 + fixedExpensesAmount + 2000
      }
      
      const totalExpenses = fixedExpenses.total + variableExpenses
      const income = 85000 // Default income - could be made configurable
      const savings = income - totalExpenses
      const savingsRate = income > 0 ? (savings / income) * 100 : 0
      const investmentRate = income > 0 ? (sipInvestments / income) * 100 : 0
      
      // Calculate financial health score
      let healthScore = 'Poor'
      const avgScore = (savingsRate + investmentRate) / 2
      if (avgScore >= 30) healthScore = 'Excellent'
      else if (avgScore >= 20) healthScore = 'Good'
      else if (avgScore >= 10) healthScore = 'Fair'
      
      setData({
        income,
        fixedExpenses,
        variableExpenses,
        totalExpenses,
        savings,
        savingsRate,
        investmentRate,
        financialHealthScore: healthScore
      })
    } catch (error) {
      console.error('Error loading monthly summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monthly Summary</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Financial Overview
          </p>
        </div>
      </div>

      {/* Income & Savings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{data.income.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{data.totalExpenses.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            {data.savings >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{data.savings.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.financialHealthScore}
            </div>
            <Badge 
              variant={
                data.financialHealthScore === 'Excellent' ? 'default' :
                data.financialHealthScore === 'Good' ? 'secondary' :
                data.financialHealthScore === 'Fair' ? 'outline' : 'destructive'
              }
              className="mt-2"
            >
              {Math.round((data.savingsRate + data.investmentRate) / 2)}% Score
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Expenses Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Fixed Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border border-border rounded-lg">
              <span className="font-medium">Loan EMIs</span>
              <span className="font-bold">₹{data.fixedExpenses.loanEMIs.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center p-3 border border-border rounded-lg">
              <span className="font-medium">SIP Investments</span>
              <span className="font-bold text-green-600">₹{data.fixedExpenses.sipInvestments.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center p-3 border border-border rounded-lg">
              <span className="font-medium">Emergency Fund</span>
              <span className="font-bold">₹{data.fixedExpenses.emergencyFund.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center p-3 border border-border rounded-lg">
              <span className="font-medium">Fixed Expenses</span>
              <span className="font-bold">₹{data.fixedExpenses.fixedExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center p-3 border border-border rounded-lg">
              <span className="font-medium">Insurance</span>
              <span className="font-bold">₹{data.fixedExpenses.insurance.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg border-2 border-primary">
              <span className="font-bold">Total Fixed Expenses</span>
              <span className="font-bold text-lg">₹{data.fixedExpenses.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variable Expenses & Financial Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Variable Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-4">
              ₹{data.variableExpenses.toLocaleString('en-IN')}
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>% of Income</span>
                  <span>{((data.variableExpenses / data.income) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(data.variableExpenses / data.income) * 100} />
              </div>
              <p className="text-sm text-muted-foreground">
                Includes dining, entertainment, shopping, and other discretionary spending
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Health Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Savings Rate</span>
                  <span className="font-bold">{data.savingsRate.toFixed(1)}%</span>
                </div>
                <Progress value={Math.max(0, data.savingsRate)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Target: 20%+ (Excellent)
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Investment Rate</span>
                  <span className="font-bold text-green-600">{data.investmentRate.toFixed(1)}%</span>
                </div>
                <Progress value={data.investmentRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Target: 15%+ (Good)
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Expense Ratio</span>
                  <span className="font-bold">{((data.totalExpenses / data.income) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(data.totalExpenses / data.income) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt;80% (Healthy)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Score Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Financial Health Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{data.financialHealthScore}</div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <Badge 
                variant={
                  data.financialHealthScore === 'Excellent' ? 'default' :
                  data.financialHealthScore === 'Good' ? 'secondary' :
                  data.financialHealthScore === 'Fair' ? 'outline' : 'destructive'
                }
                className="mt-2"
              >
                {Math.round((data.savingsRate + data.investmentRate) / 2)}%
              </Badge>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Strengths</h3>
              <ul className="space-y-1 text-sm">
                {data.investmentRate > 15 && (
                  <li className="flex items-center text-green-600">
                    <TrendingUp className="mr-2 h-3 w-3" />
                    Good investment rate
                  </li>
                )}
                {data.savingsRate > 10 && (
                  <li className="flex items-center text-green-600">
                    <PiggyBank className="mr-2 h-3 w-3" />
                    Positive savings rate
                  </li>
                )}
                {data.fixedExpenses.sipInvestments > 0 && (
                  <li className="flex items-center text-green-600">
                    <Target className="mr-2 h-3 w-3" />
                    Active SIP investments
                  </li>
                )}
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Areas to Improve</h3>
              <ul className="space-y-1 text-sm">
                {data.savingsRate < 10 && (
                  <li className="flex items-center text-orange-600">
                    <TrendingDown className="mr-2 h-3 w-3" />
                    Increase savings rate
                  </li>
                )}
                {data.investmentRate < 15 && (
                  <li className="flex items-center text-orange-600">
                    <Target className="mr-2 h-3 w-3" />
                    Boost investment allocation
                  </li>
                )}
                {data.variableExpenses > data.income * 0.3 && (
                  <li className="flex items-center text-orange-600">
                    <CreditCard className="mr-2 h-3 w-3" />
                    Reduce variable expenses
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}