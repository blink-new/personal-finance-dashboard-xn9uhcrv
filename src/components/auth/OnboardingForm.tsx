import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, TrendingUp, Shield, Home, GraduationCap, Car, Plane } from 'lucide-react';

const FINANCIAL_GOALS = [
  { id: 'retirement', label: 'Retirement Planning', icon: TrendingUp },
  { id: 'emergency', label: 'Emergency Fund', icon: Shield },
  { id: 'house', label: 'Buy a House', icon: Home },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'car', label: 'Buy a Car', icon: Car },
  { id: 'travel', label: 'Travel', icon: Plane },
];

export const OnboardingForm: React.FC = () => {
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [emergencyFund, setEmergencyFund] = useState('');
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high' | ''>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { completeOnboarding } = useAuth();

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyIncome || !emergencyFund || !riskTolerance) return;

    setLoading(true);
    try {
      await completeOnboarding({
        monthlyIncome: parseFloat(monthlyIncome),
        emergencyFund: parseFloat(emergencyFund),
        riskTolerance: riskTolerance as 'low' | 'medium' | 'high',
        financialGoals: selectedGoals,
      });
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">Welcome to Your Financial Journey!</CardTitle>
          <CardDescription className="text-lg">
            Let's set up your profile to provide personalized financial insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Monthly Income */}
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome" className="text-base font-medium">
                Monthly Income (₹)
              </Label>
              <Input
                id="monthlyIncome"
                type="number"
                placeholder="e.g., 50000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                required
                disabled={loading}
                min="0"
                step="1000"
              />
              <p className="text-sm text-gray-500">Your total monthly income after taxes</p>
            </div>

            {/* Emergency Fund */}
            <div className="space-y-2">
              <Label htmlFor="emergencyFund" className="text-base font-medium">
                Current Emergency Fund (₹)
              </Label>
              <Input
                id="emergencyFund"
                type="number"
                placeholder="e.g., 100000"
                value={emergencyFund}
                onChange={(e) => setEmergencyFund(e.target.value)}
                required
                disabled={loading}
                min="0"
                step="1000"
              />
              <p className="text-sm text-gray-500">Money set aside for unexpected expenses</p>
            </div>

            {/* Risk Tolerance */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Investment Risk Tolerance</Label>
              <Select value={riskTolerance} onValueChange={(value: 'low' | 'medium' | 'high') => setRiskTolerance(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your risk tolerance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Conservative (Low Risk)</span>
                      <span className="text-sm text-gray-500">Prefer stable, low-risk investments</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Moderate (Medium Risk)</span>
                      <span className="text-sm text-gray-500">Balanced approach to risk and returns</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Aggressive (High Risk)</span>
                      <span className="text-sm text-gray-500">Comfortable with high-risk, high-reward investments</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Financial Goals */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Financial Goals (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {FINANCIAL_GOALS.map((goal) => {
                  const Icon = goal.icon;
                  return (
                    <div
                      key={goal.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedGoals.includes(goal.id)
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleGoalToggle(goal.id)}
                    >
                      <Checkbox
                        checked={selectedGoals.includes(goal.id)}
                        onChange={() => handleGoalToggle(goal.id)}
                      />
                      <Icon className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">{goal.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg" 
              disabled={loading || !monthlyIncome || !emergencyFund || !riskTolerance}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Setting up your dashboard...
                </>
              ) : (
                'Complete Setup & Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};