import { useState, useEffect } from 'react'
import { OverviewCards } from './OverviewCards'
import { blink } from '@/blink/client'
import { Loan, SipInvestment, Budget } from '@/types/finance'

export function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loans, setLoans] = useState<Loan[]>([])
  const [investments, setInvestments] = useState<SipInvestment[]>([])
  const [budget, setBudget] = useState<Budget | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadFinancialData()
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadFinancialData = async () => {
    if (!user?.id) return

    try {
      // Load loans
      const loansData = await blink.db.loans.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setLoans(loansData)

      // Load SIP investments
      const investmentsData = await blink.db.sipInvestments.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setInvestments(investmentsData)

      // Load current month budget
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()

      const budgetData = await blink.db.budgets.list({
        where: { 
          userId: user.id,
          month: currentMonth,
          year: currentYear,
          category: 'total'
        },
        limit: 1
      })
      
      if (budgetData.length > 0) {
        setBudget(budgetData[0])
      } else {
        // Create default budget if none exists
        const defaultBudget = await blink.db.budgets.create({
          userId: user.id,
          category: 'total',
          monthlyLimit: 30000,
          currentSpent: 0,
          month: currentMonth,
          year: currentYear
        })
        setBudget(defaultBudget)
      }
    } catch (error) {
      console.error('Error loading financial data:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading your financial dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Please sign in to view your dashboard</div>
      </div>
    )
  }

  // Calculate totals
  const totalLoans = loans.reduce((sum, loan) => sum + loan.outstandingAmount, 0)
  const totalEMI = loans.reduce((sum, loan) => sum + loan.emiAmount, 0)
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
  const netWorth = totalInvestments - totalLoans
  const monthlyBudget = budget?.monthlyLimit || 0
  const spentAmount = budget?.currentSpent || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.email}</p>
        </div>
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
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Add Investment</h3>
          <p className="text-green-100 text-sm">Record your monthly SIP investments</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Track Expenses</h3>
          <p className="text-blue-100 text-sm">Log your daily expenses</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Loan Calculator</h3>
          <p className="text-purple-100 text-sm">Calculate prepayment benefits</p>
        </div>
      </div>
    </div>
  )
}