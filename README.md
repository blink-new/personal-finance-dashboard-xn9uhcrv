# Personal Finance Management Dashboard

A comprehensive full-stack web application for managing personal finances built with React + Node.js.

## Features

- **User Authentication**: Secure JWT-based authentication with registration and login
- **User Onboarding**: Collect financial profile data (income, risk tolerance, goals)
- **Net Worth Tracking**: Real-time calculation of assets vs liabilities
- **Budget Management**: Monthly budget tracking with category-wise breakdown
- **Loan Tracker**: Manage loans with EMI tracking and prepayment calculations
- **SIP Investment Dashboard**: Portfolio management with 10-year projections
- **Daily Expense Tracking**: Log and categorize daily expenses
- **Monthly Financial Summary**: Comprehensive financial health scoring

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **ShadCN UI** for components
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** with Prisma ORM
- **JWT** for authentication
- **Zod** for validation
- **bcryptjs** for password hashing

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database URL and JWT secret:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/personal_finance_db"
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_EXPIRES_IN="7d"
   PORT=5000
   NODE_ENV="development"
   FRONTEND_URL="http://localhost:3000"
   ```

4. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to project root:**
   ```bash
   cd ..
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/onboarding` - Complete user onboarding

### Financial Data
- `GET /api/loans` - Get user loans
- `POST /api/loans` - Create new loan
- `PUT /api/loans/:id` - Update loan
- `DELETE /api/loans/:id` - Delete loan
- `POST /api/loans/:id/prepayment` - Calculate prepayment impact

- `GET /api/investments` - Get SIP investments
- `POST /api/investments` - Create new investment
- `GET /api/investments/portfolio/projection` - Get portfolio projection

- `GET /api/expenses` - Get expenses (with filters)
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/summary/:year/:month` - Get monthly expense summary

- `GET /api/budgets/current` - Get current month budget
- `POST /api/budgets/initialize` - Initialize default budgets

- `GET /api/summary/current` - Get current financial summary
- `POST /api/summary/generate/:year/:month` - Generate monthly summary

## Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts with onboarding data
- **Accounts**: Bank accounts and assets
- **Loans**: Loan details with EMI tracking
- **SipInvestments**: SIP investment plans
- **MonthlyInvestments**: Monthly investment records
- **Expenses**: Daily expense tracking
- **Budgets**: Monthly budget allocations
- **FinancialSummaries**: Monthly financial health reports

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start with hot reload
npm run build  # Build for production
npm run start  # Start production server
```

### Frontend Development
```bash
npm run dev  # Start development server
npm run build  # Build for production
npm run preview  # Preview production build
```

### Database Management
```bash
cd backend
npx prisma studio  # Open database GUI
npx prisma migrate dev  # Create new migration
npx prisma db push  # Push schema changes
```

## Production Deployment

1. **Backend**: Deploy to services like Railway, Render, or AWS
2. **Frontend**: Deploy to Vercel, Netlify, or similar
3. **Database**: Use managed PostgreSQL (Railway, Supabase, AWS RDS)

Make sure to update environment variables for production URLs and secure JWT secrets.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.