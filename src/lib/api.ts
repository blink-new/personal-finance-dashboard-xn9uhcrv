import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { email: string; password: string; name?: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  completeOnboarding: async (data: {
    monthlyIncome: number;
    emergencyFund: number;
    riskTolerance: 'low' | 'medium' | 'high';
    financialGoals: string[];
  }) => {
    const response = await api.post('/user/onboarding', data);
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },
};

// Accounts API
export const accountsAPI = {
  getAll: async () => {
    const response = await api.get('/accounts');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/accounts', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },
};

// Loans API
export const loansAPI = {
  getAll: async () => {
    const response = await api.get('/loans');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/loans', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/loans/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/loans/${id}`);
    return response.data;
  },

  calculatePrepayment: async (id: string, prepaymentAmount: number) => {
    const response = await api.post(`/loans/${id}/prepayment`, { prepaymentAmount });
    return response.data;
  },
};

// Investments API
export const investmentsAPI = {
  getAll: async () => {
    const response = await api.get('/investments');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/investments', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/investments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/investments/${id}`);
    return response.data;
  },

  addMonthlyInvestment: async (data: any) => {
    const response = await api.post('/investments/monthly', data);
    return response.data;
  },
};

// Expenses API
export const expensesAPI = {
  getAll: async (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response = await api.get(`/expenses?${params.toString()}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
};

// Budgets API
export const budgetsAPI = {
  getAll: async (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response = await api.get(`/budgets?${params.toString()}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/budgets', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};

// Summary API
export const summaryAPI = {
  getMonthlySummary: async (month: number, year: number) => {
    const response = await api.get(`/summary/monthly?month=${month}&year=${year}`);
    return response.data;
  },

  getFinancialHealth: async () => {
    const response = await api.get('/summary/health');
    return response.data;
  },
};

export default api;