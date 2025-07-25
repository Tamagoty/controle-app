-- // supabase/migrations/0005_seed.sql
-- =================================================================
-- SCRIPT 5: DADOS INICIAIS (SEED)
-- Popula as tabelas com dados essenciais para o funcionamento
-- inicial da aplicação.
-- =================================================================

-- Inserir Categorias de Produtos
INSERT INTO public.product_categories (name) VALUES ('Matéria-Prima'), ('Ferramentas'), ('Componentes Eletrónicos'), ('Equipamento de Segurança') ON CONFLICT (name) DO NOTHING;

-- Inserir Centros de Custo
INSERT INTO public.cost_centers (name, description, created_at) VALUES 
('Vendas Online', 'Custos e receitas associados ao e-commerce', NOW()), 
('Loja Física', 'Custos e receitas da loja principal', NOW()), 
('Administrativo', 'Despesas gerais e administrativas', NOW()), 
('Marketing', 'Custos com publicidade e promoção', NOW()) 
ON CONFLICT (name) DO NOTHING;

-- Inserir Categorias de Despesa
INSERT INTO public.expense_categories (name) VALUES ('Salários'), ('Aluguer'), ('Contas de Consumo (Água, Luz)'), ('Marketing e Publicidade'), ('Material de Escritório'), ('Manutenção') ON CONFLICT (name) DO NOTHING;
