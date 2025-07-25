-- // supabase/migrations/0001_schema.sql
-- =================================================================
-- SCRIPT 1: SCHEMA DA BASE DE DADOS
-- Define todas as tabelas e a sua estrutura.
-- =================================================================

-- Habilita a extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- Tabelas de Pessoas, Empresas e Papéis ---
CREATE TABLE IF NOT EXISTS public.entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  document_number VARCHAR(20) UNIQUE,
  address TEXT,
  entity_type VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL
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

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_settings JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  avatar_url TEXT,
  media_settings JSONB DEFAULT '{"image_quality": 0.6, "max_size_mb": 1, "max_width_or_height": 1920}'::jsonb
);

-- --- Tabelas de Produtos e Stock ---
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
  quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- --- Tabelas Financeiras e Operacionais ---
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ,
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
  quantity NUMERIC(10, 3) NOT NULL,
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
  quantity NUMERIC(10, 3) NOT NULL,
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

-- --- Tabelas de Pagamentos ---
CREATE TABLE IF NOT EXISTS public.sale_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expense_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.general_expenses(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commission_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id),
  seller_id UUID NOT NULL REFERENCES public.entities(id),
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- Tabelas de Capital ---
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

-- --- Tabela de Anexos ---
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_id TEXT NOT NULL DEFAULT 'attachments',
    file_path TEXT NOT NULL UNIQUE,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES public.general_expenses(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    sale_payment_id UUID REFERENCES public.sale_payments(id) ON DELETE CASCADE,
    purchase_payment_id UUID REFERENCES public.purchase_payments(id) ON DELETE CASCADE,
    expense_payment_id UUID REFERENCES public.expense_payments(id) ON DELETE CASCADE,
    CONSTRAINT attachment_type_check CHECK (
      (
        (CASE WHEN purchase_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN expense_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN sale_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN sale_payment_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN purchase_payment_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN expense_payment_id IS NOT NULL THEN 1 ELSE 0 END)
      ) = 1
    )
);
