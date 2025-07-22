-- =================================================================
-- SCRIPT DE MIGRAÇÃO COMPLETO E OTIMIZADO
-- Autor: CM&M AGROGESTOR
-- Versão: 1.0
-- Descrição: Este script contém a estrutura final do banco de dados,
--            incluindo tabelas, funções, políticas de segurança e
--            dados iniciais para recriar o ambiente do zero.
-- =================================================================

-- =========== PARTE 1: ESTRUTURA DAS TABELAS (SCHEMA) ===========

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

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_settings JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  quantity INT NOT NULL DEFAULT 0,
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
    CONSTRAINT purchase_or_expense_check CHECK (
        (purchase_id IS NOT NULL AND expense_id IS NULL) OR
        (purchase_id IS NULL AND expense_id IS NOT NULL)
    )
);

-- =========== PARTE 2: FUNÇÕES E AUTOMAÇÕES ===========

-- --- Funções Auxiliares e Triggers ---
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_update
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION handle_profile_update();

CREATE OR REPLACE FUNCTION public.handle_stock_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND TG_TABLE_NAME = 'purchase_items') THEN
    INSERT INTO public.product_stock (product_id, quantity)
    VALUES (NEW.product_id, NEW.quantity)
    ON CONFLICT (product_id) DO UPDATE SET quantity = product_stock.quantity + NEW.quantity, last_updated = NOW();
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT' AND TG_TABLE_NAME = 'sale_items') THEN
    INSERT INTO public.product_stock (product_id, quantity)
    VALUES (NEW.product_id, -NEW.quantity)
    ON CONFLICT (product_id) DO UPDATE SET quantity = product_stock.quantity - NEW.quantity, last_updated = NOW();
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_purchase_item_insert AFTER INSERT ON public.purchase_items FOR EACH ROW EXECUTE FUNCTION handle_stock_change();
CREATE TRIGGER on_sale_item_insert AFTER INSERT ON public.sale_items FOR EACH ROW EXECUTE FUNCTION handle_stock_change();

-- --- Funções RPC (Remote Procedure Calls) ---

-- Funções de Lógica de Negócio (CRUD com detalhes)
CREATE OR REPLACE FUNCTION public.adjust_stock_quantity(p_product_id UUID, p_adjustment_quantity INT)
RETURNS VOID LANGUAGE sql AS $$
  INSERT INTO public.product_stock (product_id, quantity)
  VALUES (p_product_id, p_adjustment_quantity)
  ON CONFLICT (product_id) DO UPDATE SET quantity = product_stock.quantity + p_adjustment_quantity, last_updated = NOW();
$$;

CREATE OR REPLACE FUNCTION public.create_entity_with_roles(name_param TEXT, email_param TEXT, phone_param TEXT, document_number_param TEXT, address_param TEXT, entity_type_param TEXT, roles_param TEXT[])
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_entity_id UUID; role_item TEXT;
BEGIN
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type) VALUES (
      name_param, NULLIF(TRIM(email_param), ''), NULLIF(TRIM(phone_param), ''), NULLIF(TRIM(document_number_param), ''), NULLIF(TRIM(address_param), ''), entity_type_param
    ) RETURNING id INTO new_entity_id;
    IF array_length(roles_param, 1) > 0 THEN
        FOREACH role_item IN ARRAY roles_param LOOP
            INSERT INTO public.entity_roles (entity_id, role) VALUES (new_entity_id, role_item);
        END LOOP;
    END IF;
    RETURN (SELECT row_to_json(e) FROM public.entities e WHERE e.id = new_entity_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_entity_with_roles(entity_id_param UUID, name_param TEXT, email_param TEXT, phone_param TEXT, document_number_param TEXT, address_param TEXT, entity_type_param TEXT, roles_param TEXT[])
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    role_item TEXT;
BEGIN
    UPDATE public.entities SET
      name = name_param, email = NULLIF(TRIM(email_param), ''), phone = NULLIF(TRIM(phone_param), ''), document_number = NULLIF(TRIM(document_number_param), ''), address = NULLIF(TRIM(address_param), ''), entity_type = entity_type_param
    WHERE id = entity_id_param;
    DELETE FROM public.entity_roles WHERE entity_id = entity_id_param;
    IF array_length(roles_param, 1) > 0 THEN
        FOREACH role_item IN ARRAY roles_param LOOP
            INSERT INTO public.entity_roles (entity_id, role) VALUES (entity_id_param, role_item);
        END LOOP;
    END IF;
    RETURN (SELECT row_to_json(e) FROM public.entities e WHERE e.id = entity_id_param);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_sale_with_details(client_id_param UUID, seller_id_param UUID, cost_center_id_param INT, commission_percentage_param NUMERIC, items_param JSONB, payment_amount_param NUMERIC DEFAULT 0)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_sale_id UUID; item RECORD; total_amount_calc NUMERIC(10, 2) := 0; item_total_price NUMERIC(10, 2); product_name_temp VARCHAR(255);
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price; total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;
    INSERT INTO public.sales (client_id, seller_id, cost_center_id, total_amount, commission_percentage)
    VALUES (client_id_param, seller_id_param, cost_center_id_param, total_amount_calc, commission_percentage_param) RETURNING id INTO new_sale_id;
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        SELECT name INTO product_name_temp FROM public.products WHERE id = item.product_id;
        item_total_price := item.quantity * item.unit_price;
        INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price, product_name_snapshot)
        VALUES (new_sale_id, item.product_id, item.quantity, item.unit_price, item_total_price, product_name_temp);
    END LOOP;
    IF payment_amount_param > 0 THEN
        INSERT INTO public.sale_payments (sale_id, amount_paid) VALUES (new_sale_id, payment_amount_param);
    END IF;
    RETURN (SELECT row_to_json(s) FROM public.sales s WHERE s.id = new_sale_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_purchase_with_details(supplier_id_param UUID, cost_center_id_param INT, items_param JSONB, payment_amount_param NUMERIC DEFAULT 0)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_purchase_id UUID; item RECORD; total_amount_calc NUMERIC(10, 2) := 0; item_total_price NUMERIC(10, 2);
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price; total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;
    INSERT INTO public.purchases (supplier_id, cost_center_id, total_amount)
    VALUES (supplier_id_param, cost_center_id_param, total_amount_calc) RETURNING id INTO new_purchase_id;
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price;
        INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_price, total_price)
        VALUES (new_purchase_id, item.product_id, item.quantity, item.unit_price, item_total_price);
    END LOOP;
    IF payment_amount_param > 0 THEN
        INSERT INTO public.purchase_payments (purchase_id, amount_paid) VALUES (new_purchase_id, payment_amount_param);
    END IF;
    RETURN (SELECT row_to_json(p) FROM public.purchases p WHERE p.id = new_purchase_id);
END;
$$;

-- Funções de Pagamento
CREATE OR REPLACE FUNCTION public.pay_seller_commission(p_seller_id UUID, p_payment_amount NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    sale_record RECORD; commission_due NUMERIC; commission_paid NUMERIC; commission_balance NUMERIC; payment_to_apply NUMERIC; remaining_payment_amount NUMERIC := p_payment_amount;
BEGIN
    FOR sale_record IN SELECT s.id as sale_id, s.total_amount, s.commission_percentage FROM public.sales s WHERE s.seller_id = p_seller_id AND s.commission_percentage > 0 ORDER BY s.sale_date ASC LOOP
        IF remaining_payment_amount <= 0 THEN EXIT; END IF;
        commission_due := sale_record.total_amount * (sale_record.commission_percentage / 100);
        SELECT COALESCE(SUM(amount_paid), 0) INTO commission_paid FROM public.commission_payments WHERE sale_id = sale_record.sale_id;
        commission_balance := commission_due - commission_paid;
        IF commission_balance > 0 THEN
            payment_to_apply := LEAST(remaining_payment_amount, commission_balance);
            INSERT INTO public.commission_payments (seller_id, sale_id, amount_paid) VALUES (p_seller_id, sale_record.sale_id, payment_to_apply);
            remaining_payment_amount := remaining_payment_amount - payment_to_apply;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.pay_client_debt(p_client_id UUID, p_payment_amount NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    sale_record RECORD; payment_to_apply NUMERIC; remaining_payment_amount NUMERIC := p_payment_amount;
BEGIN
    FOR sale_record IN SELECT s.id as sale_id, (s.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.sale_payments WHERE sale_id = s.id), 0)) as balance FROM public.sales s WHERE s.client_id = p_client_id AND (s.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.sale_payments WHERE sale_id = s.id), 0)) > 0 ORDER BY s.sale_date ASC LOOP
        IF remaining_payment_amount <= 0 THEN EXIT; END IF;
        payment_to_apply := LEAST(remaining_payment_amount, sale_record.balance);
        INSERT INTO public.sale_payments (sale_id, amount_paid) VALUES (sale_record.sale_id, payment_to_apply);
        remaining_payment_amount := remaining_payment_amount - payment_to_apply;
    END LOOP;
END;
$$;

-- Funções de Leitura (GET) para as páginas
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_sales_with_payment_status()
RETURNS TABLE(id UUID, sale_date TIMESTAMPTZ, client_name TEXT, seller_name TEXT, cost_center_name TEXT, total_amount NUMERIC, commission_percentage NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT s.id, s.sale_date, client_entity.name as client_name, seller_entity.name as seller_name, cc.name as cost_center_name, s.total_amount, s.commission_percentage, COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp WHERE sp.sale_id = s.id), 0) as total_paid, s.total_amount - COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp WHERE sp.sale_id = s.id), 0) as balance FROM public.sales s LEFT JOIN public.entities client_entity ON s.client_id = client_entity.id LEFT JOIN public.entities seller_entity ON s.seller_id = seller_entity.id LEFT JOIN public.cost_centers cc ON s.cost_center_id = cc.id ORDER BY s.sale_date DESC; $$;

CREATE OR REPLACE FUNCTION public.get_purchases_with_payment_status()
RETURNS TABLE(id UUID, purchase_date TIMESTAMPTZ, supplier_name TEXT, cost_center_name TEXT, total_amount NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT p.id, p.purchase_date, supplier_entity.name as supplier_name, cc.name as cost_center_name, p.total_amount, COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp WHERE pp.purchase_id = p.id), 0) as total_paid, p.total_amount - COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp WHERE pp.purchase_id = p.id), 0) as balance FROM public.purchases p LEFT JOIN public.entities supplier_entity ON p.supplier_id = supplier_entity.id LEFT JOIN public.cost_centers cc ON p.cost_center_id = cc.id ORDER BY p.purchase_date DESC; $$;

CREATE OR REPLACE FUNCTION public.get_expenses_with_payment_status()
RETURNS TABLE(id UUID, description TEXT, amount NUMERIC, expense_date TIMESTAMPTZ, category_name TEXT, cost_center_name TEXT, employee_name TEXT, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT ge.id, ge.description, ge.amount, ge.expense_date, ec.name as category_name, cc.name as cost_center_name, e.name as employee_name, COALESCE((SELECT SUM(ep.amount_paid) FROM public.expense_payments ep WHERE ep.expense_id = ge.id), 0) as total_paid, ge.amount - COALESCE((SELECT SUM(ep.amount_paid) FROM public.expense_payments ep WHERE ep.expense_id = ge.id), 0) as balance FROM public.general_expenses ge LEFT JOIN public.expense_categories ec ON ge.category_id = ec.id LEFT JOIN public.cost_centers cc ON ge.cost_center_id = cc.id LEFT JOIN public.entities e ON ge.employee_id = e.id ORDER BY ge.expense_date DESC; $$;

CREATE OR REPLACE FUNCTION public.get_commission_summary()
RETURNS TABLE(seller_id UUID, seller_name TEXT, total_commission_due NUMERIC, total_commission_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT e.id as seller_id, e.name as seller_name, COALESCE(SUM(s.total_amount * (s.commission_percentage / 100)), 0) as total_commission_due, COALESCE((SELECT SUM(cp.amount_paid) FROM public.commission_payments cp WHERE cp.seller_id = e.id), 0) as total_commission_paid, COALESCE(SUM(s.total_amount * (s.commission_percentage / 100)), 0) - COALESCE((SELECT SUM(cp.amount_paid) FROM public.commission_payments cp WHERE cp.seller_id = e.id), 0) as balance FROM public.entities e JOIN public.sales s ON e.id = s.seller_id WHERE s.commission_percentage > 0 GROUP BY e.id, e.name ORDER BY balance DESC, e.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_accounts_receivable_summary()
RETURNS TABLE(client_id UUID, client_name TEXT, total_due NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT e.id as client_id, e.name as client_name, COALESCE(SUM(s.total_amount), 0) as total_due, COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp JOIN public.sales s_inner ON sp.sale_id = s_inner.id WHERE s_inner.client_id = e.id), 0) as total_paid, COALESCE(SUM(s.total_amount), 0) - COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp JOIN public.sales s_inner ON sp.sale_id = s_inner.id WHERE s_inner.client_id = e.id), 0) as balance FROM public.entities e JOIN public.sales s ON e.id = s.client_id GROUP BY e.id, e.name HAVING (COALESCE(SUM(s.total_amount), 0) - COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp JOIN public.sales s_inner ON sp.sale_id = s_inner.id WHERE s_inner.client_id = e.id), 0)) > 0 ORDER BY balance DESC, e.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_accounts_payable_summary()
RETURNS TABLE(supplier_id UUID, supplier_name TEXT, total_due NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT e.id as supplier_id, e.name as supplier_name, COALESCE(SUM(p.total_amount), 0) as total_due, COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp JOIN public.purchases p_inner ON pp.purchase_id = p_inner.id WHERE p_inner.supplier_id = e.id), 0) as total_paid, COALESCE(SUM(p.total_amount), 0) - COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp JOIN public.purchases p_inner ON pp.purchase_id = p_inner.id WHERE p_inner.supplier_id = e.id), 0) as balance FROM public.entities e JOIN public.purchases p ON e.id = p.supplier_id GROUP BY e.id, e.name HAVING (COALESCE(SUM(p.total_amount), 0) - COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp JOIN public.purchases p_inner ON pp.purchase_id = p_inner.id WHERE p_inner.supplier_id = e.id), 0)) > 0 ORDER BY balance DESC, e.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_partners_with_details()
RETURNS TABLE(id UUID, entity_id UUID, name TEXT, equity_percentage NUMERIC, is_active BOOLEAN, entry_date DATE, exit_date DATE)
LANGUAGE sql STABLE AS $$ SELECT p.id, e.id AS entity_id, e.name, p.equity_percentage, p.is_active, p.entry_date, p.exit_date FROM public.entities e INNER JOIN public.entity_roles er ON e.id = er.entity_id AND er.role = 'Sócio' LEFT JOIN public.partners p ON e.id = p.entity_id ORDER BY e.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_products_with_details()
RETURNS TABLE(id UUID, name TEXT, description TEXT, sale_price NUMERIC, purchase_price NUMERIC, product_type TEXT, unit_of_measure TEXT, is_active BOOLEAN, category_id INT, category_name TEXT, stock_quantity INT)
LANGUAGE sql STABLE AS $$ SELECT p.id, p.name, p.description, p.sale_price, p.purchase_price, p.product_type, p.unit_of_measure, p.is_active, p.category_id, pc.name as category_name, COALESCE(ps.quantity, 0) as stock_quantity FROM public.products p LEFT JOIN public.product_categories pc ON p.category_id = pc.id LEFT JOIN public.product_stock ps ON p.id = ps.product_id ORDER BY p.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_entities_with_roles()
RETURNS TABLE(id UUID, name TEXT, email TEXT, phone TEXT, document_number TEXT, address TEXT, entity_type TEXT, is_active BOOLEAN, roles TEXT)
LANGUAGE sql STABLE AS $$ SELECT e.id, e.name, e.email, e.phone, e.document_number, e.address, e.entity_type, e.is_active, string_agg(er.role, ', ') as roles FROM public.entities e LEFT JOIN public.entity_roles er ON e.id = er.entity_id GROUP BY e.id ORDER BY e.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(user_id UUID, email TEXT, role TEXT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT u.id as user_id, u.email, ur.role FROM auth.users u LEFT JOIN public.user_roles ur ON u.id = ur.user_id ORDER BY u.email ASC; $$;

CREATE OR REPLACE FUNCTION public.get_cost_centers()
RETURNS TABLE(id INT, name TEXT, description TEXT, is_active BOOLEAN, created_at TIMESTAMPTZ, finalization_date TIMESTAMPTZ)
LANGUAGE sql STABLE AS $$ SELECT id, name, description, is_active, created_at, finalization_date FROM public.cost_centers ORDER BY name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_partner_transactions()
RETURNS TABLE(id UUID, transaction_date TIMESTAMPTZ, partner_name TEXT, transaction_type TEXT, amount NUMERIC, description TEXT)
LANGUAGE sql STABLE AS $$ SELECT pt.id, pt.transaction_date, e.name as partner_name, pt.transaction_type, pt.amount, pt.description FROM public.partner_transactions pt JOIN public.partners p ON pt.partner_id = p.id JOIN public.entities e ON p.entity_id = e.id ORDER BY pt.transaction_date DESC; $$;

CREATE OR REPLACE FUNCTION public.get_sale_payments(p_sale_id UUID)
RETURNS TABLE (id UUID, amount_paid NUMERIC, payment_date TIMESTAMPTZ)
LANGUAGE sql STABLE AS $$ SELECT sp.id, sp.amount_paid, sp.payment_date FROM public.sale_payments sp WHERE sp.sale_id = p_sale_id ORDER BY sp.payment_date DESC; $$;

CREATE OR REPLACE FUNCTION public.get_commission_payments_for_seller(p_seller_id UUID)
RETURNS TABLE(id UUID, amount_paid NUMERIC, payment_date TIMESTAMPTZ, sale_id UUID)
LANGUAGE sql STABLE AS $$ SELECT cp.id, cp.amount_paid, cp.payment_date, cp.sale_id FROM public.commission_payments cp WHERE cp.seller_id = p_seller_id ORDER BY cp.payment_date DESC; $$;

-- Funções de Relatórios
CREATE OR REPLACE FUNCTION public.get_financial_report(p_start_date DATE, p_end_date DATE)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    report_data JSON; transactions_data JSONB := '[]'::JSONB; rec RECORD; total_inflow_calc NUMERIC := 0; total_outflow_calc NUMERIC := 0; net_profit_calc NUMERIC; end_date_inclusive TIMESTAMPTZ := p_end_date + interval '1 day';
BEGIN
    FOR rec IN SELECT 'Receita de Venda' as description, sp.amount_paid, sp.payment_date FROM public.sale_payments sp WHERE sp.payment_date >= p_start_date AND sp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Receita', 'description', rec.description, 'amount', rec.amount_paid); total_inflow_calc := total_inflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Aporte de Sócio: ' || e.name as description, pt.amount, pt.transaction_date FROM public.partner_transactions pt JOIN public.partners p ON pt.partner_id = p.id JOIN public.entities e ON p.entity_id = e.id WHERE pt.transaction_type = 'Aporte' AND pt.transaction_date >= p_start_date AND pt.transaction_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.transaction_date, 'type', 'Receita', 'description', rec.description, 'amount', rec.amount); total_inflow_calc := total_inflow_calc + rec.amount; END LOOP;
    FOR rec IN SELECT 'Pagamento a Fornecedor' as description, pp.amount_paid, pp.payment_date FROM public.purchase_payments pp WHERE pp.payment_date >= p_start_date AND pp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT ge.description, ep.amount_paid, ep.payment_date FROM public.expense_payments ep JOIN public.general_expenses ge ON ep.expense_id = ge.id WHERE ep.payment_date >= p_start_date AND ep.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Pagamento de Comissão' as description, cp.amount_paid, cp.payment_date FROM public.commission_payments cp WHERE cp.payment_date >= p_start_date AND cp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Retirada de Sócio: ' || e.name as description, pt.amount, pt.transaction_date FROM public.partner_transactions pt JOIN public.partners p ON pt.partner_id = p.id JOIN public.entities e ON p.entity_id = e.id WHERE pt.transaction_type = 'Retirada' AND pt.transaction_date >= p_start_date AND pt.transaction_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.transaction_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount); total_outflow_calc := total_outflow_calc + rec.amount; END LOOP;
    net_profit_calc := total_inflow_calc - total_outflow_calc;
    report_data := json_build_object('summary', json_build_object('total_inflow', total_inflow_calc, 'total_outflow', total_outflow_calc, 'net_profit', net_profit_calc), 'transactions', transactions_data);
    RETURN report_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_full_dashboard_data()
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    sales_total_month NUMERIC; purchases_total_month NUMERIC; new_clients_month INT; cash_balance NUMERIC; total_stock_value NUMERIC; sales_over_time JSONB; recent_sales JSONB; total_inflow_calc NUMERIC; total_outflow_calc NUMERIC;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO sales_total_month FROM public.sales WHERE sale_date >= date_trunc('month', NOW());
    SELECT COALESCE(SUM(total_amount), 0) INTO purchases_total_month FROM public.purchases WHERE purchase_date >= date_trunc('month', NOW());
    SELECT COUNT(*) INTO new_clients_month FROM public.entity_roles er JOIN public.entities e ON er.entity_id = e.id WHERE er.role = 'Cliente' AND e.created_at >= date_trunc('month', NOW());
    SELECT COALESCE(SUM(p.purchase_price * ps.quantity), 0) INTO total_stock_value FROM public.product_stock ps JOIN public.products p ON ps.product_id = p.id;
    SELECT (SELECT COALESCE(SUM(amount_paid), 0) FROM public.sale_payments) + (SELECT COALESCE(SUM(amount), 0) FROM public.partner_transactions WHERE transaction_type = 'Aporte') INTO total_inflow_calc;
    SELECT (SELECT COALESCE(SUM(amount_paid), 0) FROM public.purchase_payments) + (SELECT COALESCE(SUM(ep.amount_paid), 0) FROM public.expense_payments ep) + (SELECT COALESCE(SUM(amount_paid), 0) FROM public.commission_payments) + (SELECT COALESCE(SUM(amount), 0) FROM public.partner_transactions WHERE transaction_type = 'Retirada') INTO total_outflow_calc;
    cash_balance := total_inflow_calc - total_outflow_calc;
    SELECT jsonb_agg(daily_sales) INTO sales_over_time FROM (SELECT TO_CHAR(day_series.day, 'DD/MM') as date, COALESCE(SUM(s.total_amount), 0) as total FROM generate_series(NOW() - INTERVAL '29 days', NOW(), '1 day'::interval) as day_series(day) LEFT JOIN public.sales s ON date_trunc('day', s.sale_date) = date_trunc('day', day_series.day) GROUP BY day_series.day ORDER BY day_series.day) as daily_sales;
    SELECT jsonb_agg(recent_sales_data) INTO recent_sales FROM (SELECT s.id, s.sale_date, s.total_amount, e.name as client_name FROM public.sales s JOIN public.entities e ON s.client_id = e.id ORDER BY s.sale_date DESC LIMIT 5) as recent_sales_data;
    RETURN json_build_object('summary', json_build_object('sales_total_month', sales_total_month, 'purchases_total_month', purchases_total_month, 'new_clients_month', new_clients_month, 'cash_balance', cash_balance, 'total_stock_value', total_stock_value), 'sales_over_time', sales_over_time, 'recent_sales', recent_sales);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data(p_partner_id UUID)
RETURNS JSON LANGUAGE plpgsql STABLE AS $$
DECLARE
    summary_data JSON; transactions_data JSONB; total_aportes NUMERIC; total_retiradas NUMERIC;
BEGIN
    SELECT COALESCE(SUM(CASE WHEN transaction_type = 'Aporte' THEN amount ELSE 0 END), 0), COALESCE(SUM(CASE WHEN transaction_type = 'Retirada' THEN amount ELSE 0 END), 0)
    INTO total_aportes, total_retiradas FROM public.partner_transactions WHERE partner_id = p_partner_id;
    summary_data := json_build_object('total_aportes', total_aportes, 'total_retiradas', total_retiradas, 'saldo_atual', total_aportes - total_retiradas);
    SELECT jsonb_agg(json_build_object('id', pt.id, 'transaction_date', pt.transaction_date, 'transaction_type', pt.transaction_type, 'amount', pt.amount, 'description', pt.description) ORDER BY pt.transaction_date DESC)
    INTO transactions_data FROM public.partner_transactions pt WHERE pt.partner_id = p_partner_id;
    RETURN json_build_object('summary', summary_data, 'transactions', COALESCE(transactions_data, '[]'::jsonb));
END;
$$;

-- =========== PARTE 3: POLÍTICAS DE SEGURANÇA (RLS) ===========

-- --- Tabela: user_roles (Política Final Corrigida) ---
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage roles" ON public.user_roles FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- --- Outras Tabelas ---
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated users" ON public.entities FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.entities FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.entity_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated users" ON public.entity_roles FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.entity_roles FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access for managers and admins" ON public.partners FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.partner_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access for managers and admins" ON public.partner_transactions FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.products FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated users" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.product_categories FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated users" ON public.product_stock FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.product_stock FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access based on role" ON public.sales FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'gestor') OR seller_id IN (SELECT entity_id FROM public.entity_roles WHERE role = 'Funcionário'));
CREATE POLICY "Allow insert for authenticated users" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow modification for managers and admins" ON public.sales FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access based on sale" ON public.sale_items FOR ALL USING ((SELECT count(*) FROM public.sales WHERE id = sale_id) > 0);

ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access based on sale" ON public.sale_payments FOR ALL USING ((SELECT count(*) FROM public.sales WHERE id = sale_id) > 0);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access for managers and admins" ON public.purchases FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access based on purchase" ON public.purchase_items FOR ALL USING ((SELECT count(*) FROM public.purchases WHERE id = purchase_id) > 0);

ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access based on purchase" ON public.purchase_payments FOR ALL USING ((SELECT count(*) FROM public.purchases WHERE id = purchase_id) > 0);

ALTER TABLE public.general_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access for managers and admins" ON public.general_expenses FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated users" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.expense_categories FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.expense_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access for managers and admins" ON public.expense_payments FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access for managers and admins" ON public.commission_payments FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated users" ON public.cost_centers FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.cost_centers FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow manager and admin access to attachments" ON public.attachments FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

-- =========== PARTE 4: DADOS INICIAIS (SEED) ===========

-- Inserir Categorias de Produtos
INSERT INTO public.product_categories (name) VALUES ('Matéria-Prima'), ('Ferramentas'), ('Componentes Eletrónicos'), ('Equipamento de Segurança') ON CONFLICT (name) DO NOTHING;

-- Inserir Centros de Custo
INSERT INTO public.cost_centers (name, description) VALUES ('Vendas Online', 'Custos e receitas associados ao e-commerce'), ('Loja Física', 'Custos e receitas da loja principal'), ('Administrativo', 'Despesas gerais e administrativas'), ('Marketing', 'Custos com publicidade e promoção') ON CONFLICT (name) DO NOTHING;

-- Inserir Categorias de Despesa
INSERT INTO public.expense_categories (name) VALUES ('Salários'), ('Aluguer'), ('Contas de Consumo (Água, Luz)'), ('Marketing e Publicidade'), ('Material de Escritório'), ('Manutenção') ON CONFLICT (name) DO NOTHING;

-- =========== PARTE 5: CONFIGURAÇÃO DO STORAGE ===========

-- Bucket de Armazenamento
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false) ON CONFLICT (id) DO NOTHING;

-- Políticas do Storage
CREATE POLICY "Allow manager and admin to read attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments' AND get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow manager and admin to insert attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments' AND get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow manager and admin to delete attachments" ON storage.objects FOR DELETE USING (bucket_id = 'attachments' AND get_my_role() IN ('admin', 'gestor'));
