import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Toaster } from '@/components/ui/toaster'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'loans':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Loan Tracker</h1>
            <div className="bg-white rounded-lg border p-8 text-center">
              <p className="text-gray-600">Loan tracking features coming soon...</p>
            </div>
          </div>
        )
      case 'investments':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">SIP & Investments</h1>
            <div className="bg-white rounded-lg border p-8 text-center">
              <p className="text-gray-600">Investment dashboard coming soon...</p>
            </div>
          </div>
        )
      case 'expenses':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Daily Expenses</h1>
            <div className="bg-white rounded-lg border p-8 text-center">
              <p className="text-gray-600">Expense tracking coming soon...</p>
            </div>
          </div>
        )
      case 'summary':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Monthly Summary</h1>
            <div className="bg-white rounded-lg border p-8 text-center">
              <p className="text-gray-600">Monthly summary coming soon...</p>
            </div>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 lg:ml-0">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  )
}

export default App