-- ============================================
-- MoneyFlow Pro - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. LEDGERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ledgers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  balance NUMERIC(15, 2) DEFAULT 0,
  initial_balance NUMERIC(15, 2) DEFAULT 0,
  icon TEXT DEFAULT 'Wallet',
  account_type TEXT CHECK (account_type IN ('bank', 'credit')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'both')) NOT NULL,
  icon TEXT DEFAULT 'Tag',
  color TEXT DEFAULT '#3B82F6',
  keywords TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ledger_id UUID REFERENCES public.ledgers(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('bank', 'credit', 'cash')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. BUDGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  month INTEGER CHECK (month >= 1 AND month <= 12) NOT NULL,
  year INTEGER CHECK (year >= 2000) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- ============================================
-- 5. GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15, 2) DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE,
  description TEXT,
  icon TEXT DEFAULT 'Target',
  color TEXT DEFAULT '#10B981',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. GOAL CONTRIBUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. RECURRING TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ledger_id UUID REFERENCES public.ledgers(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('bank', 'credit', 'cash')) NOT NULL,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL,
  next_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pan_number TEXT,
  gst_number TEXT,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. FINANCIAL YEARS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.financial_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- ============================================
-- 10. AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. USER PROFILES TABLE (Extended user data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  role TEXT DEFAULT 'User',
  rights TEXT[] DEFAULT ARRAY[]::TEXT[],
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_ledger_id ON public.transactions(ledger_id);

CREATE INDEX IF NOT EXISTS idx_ledgers_user_id ON public.ledgers(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Ledgers Policies
CREATE POLICY "Users can view own ledgers" ON public.ledgers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ledgers" ON public.ledgers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ledgers" ON public.ledgers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ledgers" ON public.ledgers FOR DELETE USING (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Goals Policies
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Goal Contributions Policies (via goal ownership)
CREATE POLICY "Users can view own goal contributions" ON public.goal_contributions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_contributions.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can insert own goal contributions" ON public.goal_contributions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_contributions.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can update own goal contributions" ON public.goal_contributions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_contributions.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can delete own goal contributions" ON public.goal_contributions FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_contributions.goal_id AND goals.user_id = auth.uid()));

-- Recurring Transactions Policies
CREATE POLICY "Users can view own recurring transactions" ON public.recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring transactions" ON public.recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring transactions" ON public.recurring_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring transactions" ON public.recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- Companies Policies
CREATE POLICY "Users can view own companies" ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own companies" ON public.companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own companies" ON public.companies FOR DELETE USING (auth.uid() = user_id);

-- Financial Years Policies
CREATE POLICY "Users can view own financial years" ON public.financial_years FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial years" ON public.financial_years FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial years" ON public.financial_years FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial years" ON public.financial_years FOR DELETE USING (auth.uid() = user_id);

-- Audit Logs Policies
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- TRIGGERS for updated_at timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ledgers_updated_at BEFORE UPDATE ON public.ledgers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_updated_at BEFORE UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_years_updated_at BEFORE UPDATE ON public.financial_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, role, rights, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    'User',
    ARRAY['CORE_DASHBOARD_VIEW', 'CORE_TRANSACTIONS_VIEW', 'CORE_LEDGERS_VIEW']::TEXT[],
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Update ledger balance on transaction changes
-- ============================================

CREATE OR REPLACE FUNCTION public.update_ledger_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT
  IF (TG_OP = 'INSERT') THEN
    IF NEW.ledger_id IS NOT NULL THEN
      IF NEW.type = 'income' THEN
        UPDATE public.ledgers SET balance = balance + NEW.amount WHERE id = NEW.ledger_id;
      ELSE
        UPDATE public.ledgers SET balance = balance - NEW.amount WHERE id = NEW.ledger_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Revert old transaction effect
    IF OLD.ledger_id IS NOT NULL THEN
      IF OLD.type = 'income' THEN
        UPDATE public.ledgers SET balance = balance - OLD.amount WHERE id = OLD.ledger_id;
      ELSE
        UPDATE public.ledgers SET balance = balance + OLD.amount WHERE id = OLD.ledger_id;
      END IF;
    END IF;
    
    -- Apply new transaction effect
    IF NEW.ledger_id IS NOT NULL THEN
      IF NEW.type = 'income' THEN
        UPDATE public.ledgers SET balance = balance + NEW.amount WHERE id = NEW.ledger_id;
      ELSE
        UPDATE public.ledgers SET balance = balance - NEW.amount WHERE id = NEW.ledger_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- On DELETE
  IF (TG_OP = 'DELETE') THEN
    IF OLD.ledger_id IS NOT NULL THEN
      IF OLD.type = 'income' THEN
        UPDATE public.ledgers SET balance = balance - OLD.amount WHERE id = OLD.ledger_id;
      ELSE
        UPDATE public.ledgers SET balance = balance + OLD.amount WHERE id = OLD.ledger_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for ledger balance updates
CREATE TRIGGER transaction_ledger_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_ledger_balance();

-- ============================================
-- FUNCTION: Update goal current amount on contribution
-- ============================================

CREATE OR REPLACE FUNCTION public.update_goal_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.goals SET current_amount = current_amount + NEW.amount WHERE id = NEW.goal_id;
    RETURN NEW;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    UPDATE public.goals SET current_amount = current_amount - OLD.amount WHERE id = OLD.goal_id;
    RETURN OLD;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    UPDATE public.goals SET current_amount = current_amount - OLD.amount + NEW.amount WHERE id = NEW.goal_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for goal amount updates
CREATE TRIGGER goal_contribution_amount
  AFTER INSERT OR UPDATE OR DELETE ON public.goal_contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_goal_amount();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ MoneyFlow Pro database schema created successfully!';
  RAISE NOTICE '📊 Tables: ledgers, categories, transactions, budgets, goals, goal_contributions, recurring_transactions, companies, financial_years, audit_logs, user_profiles';
  RAISE NOTICE '🔒 Row Level Security (RLS) enabled on all tables';
  RAISE NOTICE '🚀 Auto-triggers configured for balance updates and user profiles';
END $$;
