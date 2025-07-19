export interface User {
  id: string;
  email: string;
  name?: string;
  monthlyIncome?: number;
  emergencyFund?: number;
  riskTolerance?: 'low' | 'medium' | 'high';
  financialGoals?: string[];
  isOnboardingComplete: boolean;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: (data: {
    monthlyIncome: number;
    emergencyFund: number;
    riskTolerance: 'low' | 'medium' | 'high';
    financialGoals: string[];
  }) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}