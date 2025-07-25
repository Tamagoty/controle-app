-- // supabase/migrations/0004_security.sql
-- =================================================================
-- SCRIPT 4: POLÍTICAS DE SEGURANÇA (RLS) E STORAGE
-- Ativa a segurança e define as regras de acesso para cada tabela
-- e para os buckets de armazenamento.
-- =================================================================

-- --- Ativação da RLS em todas as tabelas ---
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- --- Políticas de Segurança (RLS) ---

-- Tabela: user_roles
CREATE POLICY "Allow authenticated users to read all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage roles" ON public.user_roles FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Tabela: user_profiles
CREATE POLICY "Allow individual user access to their own profile" ON public.user_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabelas com acesso de leitura para todos e escrita para gestores/admins
CREATE POLICY "Allow read for authenticated users" ON public.entities FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.entities FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "Allow read for authenticated users" ON public.entity_roles FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.entity_roles FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "Allow read for authenticated users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.products FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "Allow read for authenticated users" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.product_categories FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "Allow read for authenticated users" ON public.product_stock FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.product_stock FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "Allow read for authenticated users" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.expense_categories FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "Allow read for authenticated users" ON public.cost_centers FOR SELECT USING (true);
CREATE POLICY "Allow modification for managers and admins" ON public.cost_centers FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

-- Tabelas com acesso restrito a gestores/admins
CREATE POLICY "Allow access for managers and admins" ON public.partners FOR ALL USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow access for managers and admins" ON public.partner_transactions FOR ALL USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow access for managers and admins" ON public.purchases FOR ALL USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow access for managers and admins" ON public.general_expenses FOR ALL USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow access for managers and admins" ON public.expense_payments FOR ALL USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow access for managers and admins" ON public.commission_payments FOR ALL USING (get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow manager and admin access to attachments" ON public.attachments FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

-- Tabelas com lógicas mais específicas
CREATE POLICY "Allow read access based on role" ON public.sales FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'gestor') OR seller_id IN (SELECT entity_id FROM public.entity_roles WHERE role = 'Funcionário'));
CREATE POLICY "Allow insert for authenticated users" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow modification for managers and admins" ON public.sales FOR ALL USING (get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "Allow access based on sale" ON public.sale_items FOR ALL USING ((SELECT count(*) FROM public.sales WHERE id = sale_id) > 0);
CREATE POLICY "Allow access based on sale" ON public.sale_payments FOR ALL USING ((SELECT count(*) FROM public.sales WHERE id = sale_id) > 0);
CREATE POLICY "Allow access based on purchase" ON public.purchase_items FOR ALL USING ((SELECT count(*) FROM public.purchases WHERE id = purchase_id) > 0);
CREATE POLICY "Allow access based on purchase" ON public.purchase_payments FOR ALL USING ((SELECT count(*) FROM public.purchases WHERE id = purchase_id) > 0);


-- --- Configuração do Storage ---
-- Bucket de Armazenamento para Anexos
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false) ON CONFLICT (id) DO NOTHING;

-- Políticas do Storage de Anexos
CREATE POLICY "Allow manager and admin to read attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments' AND get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow manager and admin to insert attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments' AND get_my_role() IN ('admin', 'gestor'));
CREATE POLICY "Allow manager and admin to delete attachments" ON storage.objects FOR DELETE USING (bucket_id = 'attachments' AND get_my_role() IN ('admin', 'gestor'));

-- Bucket de Armazenamento para Avatares
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Políticas do Storage de Avatares
CREATE POLICY "Allow public read access to avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow authenticated users to insert their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
CREATE POLICY "Allow authenticated users to update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
CREATE POLICY "Allow authenticated users to delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
