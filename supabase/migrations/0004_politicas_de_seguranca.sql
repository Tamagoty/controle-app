-- =================================================================
-- SCRIPT 4: POLÍTICAS DE SEGURANÇA (RLS)
-- Ativa a segurança e define as regras de acesso para cada tabela.
-- =================================================================

-- Função auxiliar para obter o papel do utilizador
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

-- Tabela: user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to delete roles" ON public.user_roles;
CREATE POLICY "Allow individual user to read their own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow admins to insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow admins to update roles" ON public.user_roles FOR UPDATE TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow admins to delete roles" ON public.user_roles FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- Tabela: entities (Pessoas & Empresas)
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.entities;
DROP POLICY IF EXISTS "Allow insert for managers and admins" ON public.entities;
DROP POLICY IF EXISTS "Allow update for managers and admins" ON public.entities;
DROP POLICY IF EXISTS "Allow delete for managers and admins" ON public.entities;
CREATE POLICY "Allow read for authenticated users" ON public.entities FOR SELECT USING (true);
CREATE POLICY "Allow insert for managers and admins" ON public.entities FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow update for managers and admins" ON public.entities FOR UPDATE USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow delete for managers and admins" ON public.entities FOR DELETE USING (get_my_role() IN ('admin', 'gestor'));

-- Tabela: entity_roles
ALTER TABLE public.entity_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.entity_roles;
DROP POLICY IF EXISTS "Allow insert for managers and admins" ON public.entity_roles;
DROP POLICY IF EXISTS "Allow update for managers and admins" ON public.entity_roles;
DROP POLICY IF EXISTS "Allow delete for managers and admins" ON public.entity_roles;
CREATE POLICY "Allow read for authenticated users" ON public.entity_roles FOR SELECT USING (true);
CREATE POLICY "Allow insert for managers and admins" ON public.entity_roles FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow update for managers and admins" ON public.entity_roles FOR UPDATE USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow delete for managers and admins" ON public.entity_roles FOR DELETE USING (get_my_role() IN ('admin', 'gestor'));

-- Tabela: partners (Sócios)
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for managers and admins" ON public.partners;
DROP POLICY IF EXISTS "Allow insert for managers and admins" ON public.partners;
DROP POLICY IF EXISTS "Allow update for managers and admins" ON public.partners;
DROP POLICY IF EXISTS "Allow delete for managers and admins" ON public.partners;
CREATE POLICY "Allow read for managers and admins" ON public.partners FOR SELECT USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow insert for managers and admins" ON public.partners FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow update for managers and admins" ON public.partners FOR UPDATE USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow delete for managers and admins" ON public.partners FOR DELETE USING (get_my_role() IN ('admin', 'gestor'));

-- Tabela: partner_transactions (Transações de Sócios)
ALTER TABLE public.partner_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access for managers and admins" ON public.partner_transactions;
CREATE POLICY "Allow access for managers and admins" ON public.partner_transactions FOR ALL USING (get_my_role() IN ('admin', 'gestor')) WITH CHECK (get_my_role() IN ('admin', 'gestor'));

-- Tabela: products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Allow insert for managers and admins" ON public.products;
DROP POLICY IF EXISTS "Allow update for managers and admins" ON public.products;
DROP POLICY IF EXISTS "Allow delete for managers and admins" ON public.products;
CREATE POLICY "Allow read for authenticated users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow insert for managers and admins" ON public.products FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow update for managers and admins" ON public.products FOR UPDATE USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow delete for managers and admins" ON public.products FOR DELETE USING (get_my_role() IN ('admin', 'gestor'));

-- Tabela: product_categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.product_categories;
DROP POLICY IF EXISTS "Allow insert for managers and admins" ON public.product_categories;
DROP POLICY IF EXISTS "Allow update for managers and admins" ON public.product_categories;
DROP POLICY IF EXISTS "Allow delete for managers and admins" ON public.product_categories;
CREATE POLICY "Allow read for authenticated users" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Allow insert for managers and admins" ON public.product_categories FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow update for managers and admins" ON public.product_categories FOR UPDATE USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow delete for managers and admins" ON public.product_categories FOR DELETE USING (get_my_role() IN ('admin', 'gestor'));

-- Tabela: product_stock
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.product_stock;
DROP POLICY IF EXISTS "Allow insert for managers and admins" ON public.product_stock;
DROP POLICY IF EXISTS "Allow update for managers and admins" ON public.product_stock;
DROP POLICY IF EXISTS "Allow delete for managers and admins" ON public.product_stock;
CREATE POLICY "Allow read for authenticated users" ON public.product_stock FOR SELECT USING (true);
CREATE POLICY "Allow insert for managers and admins" ON public.product_stock FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow update for managers and admins" ON public.product_stock FOR UPDATE USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow delete for managers and admins" ON public.product_stock FOR DELETE USING (get_my_role() IN ('admin', 'gestor'));

-- Tabela: sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access based on role" ON public.sales;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.sales;
DROP POLICY IF EXISTS "Allow update for managers and admins" ON public.sales;
DROP POLICY IF EXISTS "Allow delete for managers and admins" ON public.sales;
CREATE POLICY "Allow read access based on role" ON public.sales FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'gestor') OR (get_my_role() = 'vendedor' AND seller_id = auth.uid()));
CREATE POLICY "Allow insert for authenticated users" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for managers and admins" ON public.sales FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow delete for managers and admins" ON public.sales FOR DELETE TO authenticated USING (get_my_role() IN ('admin', 'gestor'));

-- Tabela: sale_items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access based on sale" ON public.sale_items;
CREATE POLICY "Allow access based on sale" ON public.sale_items FOR ALL USING ((SELECT count(*) FROM public.sales WHERE id = sale_id) > 0) WITH CHECK ((SELECT count(*) FROM public.sales WHERE id = sale_id) > 0);

-- Tabela: sale_payments
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access based on sale" ON public.sale_payments;
CREATE POLICY "Allow access based on sale" ON public.sale_payments FOR ALL USING ((SELECT count(*) FROM public.sales WHERE id = sale_id) > 0) WITH CHECK ((SELECT count(*) FROM public.sales WHERE id = sale_id) > 0);

-- Tabela: purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access for managers and admins" ON public.purchases;
CREATE POLICY "Allow access for managers and admins" ON public.purchases FOR ALL USING (get_my_role() IN ('admin', 'gestor')) WITH CHECK (get_my_role() IN ('admin', 'gestor'));

-- Tabela: purchase_items
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access based on purchase" ON public.purchase_items;
CREATE POLICY "Allow access based on purchase" ON public.purchase_items FOR ALL USING ((SELECT count(*) FROM public.purchases WHERE id = purchase_id) > 0) WITH CHECK ((SELECT count(*) FROM public.purchases WHERE id = purchase_id) > 0);

-- Tabela: purchase_payments
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access based on purchase" ON public.purchase_payments;
CREATE POLICY "Allow access based on purchase" ON public.purchase_payments FOR ALL USING ((SELECT count(*) FROM public.purchases WHERE id = purchase_id) > 0) WITH CHECK ((SELECT count(*) FROM public.purchases WHERE id = purchase_id) > 0);

-- Tabela: general_expenses
ALTER TABLE public.general_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access for managers and admins" ON public.general_expenses;
CREATE POLICY "Allow access for managers and admins" ON public.general_expenses FOR ALL USING (get_my_role() IN ('admin', 'gestor')) WITH CHECK (get_my_role() IN ('admin', 'gestor'));

-- Tabela: expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.expense_categories;
DROP POLICY IF EXISTS "Allow insert for managers and admins" ON public.expense_categories;
DROP POLICY IF EXISTS "Allow update for managers and admins" ON public.expense_categories;
DROP POLICY IF EXISTS "Allow delete for managers and admins" ON public.expense_categories;
CREATE POLICY "Allow read for authenticated users" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow insert for managers and admins" ON public.expense_categories FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow update for managers and admins" ON public.expense_categories FOR UPDATE USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow delete for managers and admins" ON public.expense_categories FOR DELETE USING (get_my_role() IN ('admin', 'gestor'));

-- Tabela: expense_payments
ALTER TABLE public.expense_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access for managers and admins" ON public.expense_payments;
CREATE POLICY "Allow access for managers and admins" ON public.expense_payments FOR ALL USING (get_my_role() IN ('admin', 'gestor')) WITH CHECK (get_my_role() IN ('admin', 'gestor'));

-- Tabela: commission_payments
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access for managers and admins" ON public.commission_payments;
CREATE POLICY "Allow access for managers and admins" ON public.commission_payments FOR ALL USING (get_my_role() IN ('admin', 'gestor')) WITH CHECK (get_my_role() IN ('admin', 'gestor'));

-- Tabela: cost_centers
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.cost_centers;
DROP POLICY IF EXISTS "Allow insert for managers and admins" ON public.cost_centers;
DROP POLICY IF EXISTS "Allow update for managers and admins" ON public.cost_centers;
DROP POLICY IF EXISTS "Allow delete for managers and admins" ON public.cost_centers;
CREATE POLICY "Allow read for authenticated users" ON public.cost_centers FOR SELECT USING (true);
CREATE POLICY "Allow insert for managers and admins" ON public.cost_centers FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow update for managers and admins" ON public.cost_centers FOR UPDATE USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow delete for managers and admins" ON public.cost_centers FOR DELETE USING (get_my_role() IN ('admin', 'gestor'));
