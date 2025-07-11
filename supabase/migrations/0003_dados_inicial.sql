-- =================================================================
-- SCRIPT 3: DADOS INICIAIS (SEED)
-- Popula as tabelas com dados essenciais.
-- =================================================================

-- Inserir Categorias de Produtos
INSERT INTO public.product_categories (name)
VALUES
  ('Mudas'), ('Adubos/Defensivos'), ('Ferramentas'), ('Matéria-Prima'), ('Equipamentos'), ('Hortaliças'), ('Frutas'), ('Legumes'),
  ('Ovos'), ('Grãos'), ('Outros')
ON CONFLICT (name) DO NOTHING;

-- Inserir Centros de Custo
INSERT INTO public.cost_centers (name, description)
VALUES
  ('CM&M', 'Custos e receitas da Chacára Melina & Mundin'),
  ('Galpão IPAS', 'Custos e receitas do galpão da BA801'),
  ('Galpão BA052', 'Custos e receitas do galpão da BA052')
ON CONFLICT (name) DO NOTHING;

-- Inserir Categorias de Despesa
INSERT INTO public.expense_categories (name)
VALUES
  ('Salários'), ('Aluguer'), ('Conta de Água'), ('Conta de Energia'), ('Conta de Telefone'), ('Conta de Internet'), ('Material de Escritório'), ('Manutenção')
ON CONFLICT (name) DO NOTHING;
