-- =================================================================
-- SCRIPT 1: SCHEMA DA BASE DE DADOS
-- Define todas as tabelas e a sua estrutura.
-- =================================================================

-- Habilita a extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- TABELAS DE PESSOAS, EMPRESAS E PAPÉIS ---
CREATE TABLE IF NOT EXISTS public.entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  document_number VARCHAR(20) UNIQUE,
  address TEXT,
  entity_type VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.entity_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  "role" VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, "role")
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'gestor', 'vendedor')),
  UNIQUE(user_id)
);

-- --- TABELAS DE PRODUTOS E STOCK ---
CREATE TABLE IF NOT EXISTS public.product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  sale_price NUMERIC(10, 2) NOT NULL,
  purchase_price NUMERIC(10, 2) DEFAULT 0,
  product_type VARCHAR(50) DEFAULT 'Ambos',
  unit_of_measure VARCHAR(20) DEFAULT 'un',
  is_active BOOLEAN DEFAULT TRUE,
  category_id INT REFERENCES public.product_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_stock (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- --- TABELAS FINANCEIRAS E OPERACIONAIS ---
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finalization_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.entities(id),
  seller_id UUID REFERENCES public.entities(id),
  cost_center_id INT NOT NULL REFERENCES public.cost_centers(id),
  total_amount NUMERIC(10, 2) NOT NULL,
  commission_percentage NUMERIC(5, 2) DEFAULT 0,
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  product_name_snapshot VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES public.entities(id),
  cost_center_id INT NOT NULL REFERENCES public.cost_centers(id),
  total_amount NUMERIC(10, 2) NOT NULL,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.general_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  expense_date TIMESTAMPTZ DEFAULT NOW(),
  category_id INT NOT NULL REFERENCES public.expense_categories(id),
  cost_center_id INT NOT NULL REFERENCES public.cost_centers(id),
  employee_id UUID REFERENCES public.entities(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- TABELAS DE PAGAMENTOS ---
CREATE TABLE IF NOT EXISTS public.sale_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expense_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.general_expenses(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commission_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id),
  seller_id UUID NOT NULL REFERENCES public.entities(id),
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- TABELAS DE CAPITAL ---
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  equity_percentage NUMERIC(5, 2) NOT NULL CHECK (equity_percentage > 0 AND equity_percentage <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  entry_date DATE DEFAULT NOW(),
  exit_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Aporte', 'Retirada')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
