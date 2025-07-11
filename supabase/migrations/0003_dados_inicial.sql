-- =================================================================
-- SCRIPT 3: DADOS INICIAIS (SEED)
-- Popula as tabelas com dados essenciais.
-- =================================================================

-- Inserir Categorias de Produtos
INSERT INTO public.product_categories (name)
VALUES
  ('Matéria-Prima'), ('Ferramentas'), ('Componentes Eletrónicos'), ('Equipamento de Segurança')
ON CONFLICT (name) DO NOTHING;

-- Inserir Centros de Custo
INSERT INTO public.cost_centers (name, description)
VALUES
  ('Vendas Online', 'Custos e receitas associados ao e-commerce'),
  ('Loja Física', 'Custos e receitas da loja principal'),
  ('Administrativo', 'Despesas gerais e administrativas'),
  ('Marketing', 'Custos com publicidade e promoção')
ON CONFLICT (name) DO NOTHING;

-- Inserir Categorias de Despesa
INSERT INTO public.expense_categories (name)
VALUES
  ('Salários'), ('Aluguer'), ('Contas de Consumo (Água, Luz)'), ('Marketing e Publicidade'), ('Material de Escritório'), ('Manutenção')
ON CONFLICT (name) DO NOTHING;
