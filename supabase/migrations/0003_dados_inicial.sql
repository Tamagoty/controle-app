-- =================================================================
-- SCRIPT 3: DADOS INICIAIS (SEED)
-- Popula as tabelas com dados essenciais.
-- =================================================================

-- Inserir Categorias de Produtos
INSERT INTO public.product_categories (name) VALUES ('Matéria-Prima') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.product_categories (name) VALUES ('Ferramentas') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.product_categories (name) VALUES ('Componentes Eletrónicos') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.product_categories (name) VALUES ('Equipamento de Segurança') ON CONFLICT (name) DO NOTHING;

-- Inserir Centros de Custo
INSERT INTO public.cost_centers (name, description) VALUES ('Vendas Online', 'Custos e receitas associados ao e-commerce') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.cost_centers (name, description) VALUES ('Loja Física', 'Custos e receitas da loja principal') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.cost_centers (name, description) VALUES ('Administrativo', 'Despesas gerais e administrativas') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.cost_centers (name, description) VALUES ('Marketing', 'Custos com publicidade e promoção') ON CONFLICT (name) DO NOTHING;

-- Inserir Categorias de Despesa
INSERT INTO public.expense_categories (name) VALUES ('Salários') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.expense_categories (name) VALUES ('Aluguer') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.expense_categories (name) VALUES ('Contas de Consumo (Água, Luz)') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.expense_categories (name) VALUES ('Marketing e Publicidade') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.expense_categories (name) VALUES ('Material de Escritório') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.expense_categories (name) VALUES ('Manutenção') ON CONFLICT (name) DO NOTHING;

