-- =================================================================
-- SCRIPT DE POPULAÇÃO (SEED) - PRODUTOS
-- =================================================================
-- Este script insere dados de exemplo na tabela 'products'.
-- É seguro executá-lo múltiplas vezes.

-- Inserir Produtos
-- Nota: Esta inserção assume que as categorias no ficheiro 0003_dados_iniciais.sql já existem.
INSERT INTO public.products (name, description, sale_price, purchase_price, product_type, unit_of_measure, category_id)
VALUES
  ('Parafuso Sextavado M6', 'Caixa com 100 unidades, aço inoxidável.', 25.50, 15.00, 'Ambos', 'cx', (SELECT id FROM public.product_categories WHERE name = 'Matéria-Prima')),
  ('Placa de Aço 10mm', 'Placa de 1m x 1m, espessura 10mm.', 350.00, 280.00, 'Ambos', 'un', (SELECT id FROM public.product_categories WHERE name = 'Matéria-Prima')),
  ('Chave de Fenda Phillips', 'Chave de fenda magnética com cabo ergonómico.', 18.90, 11.50, 'Venda', 'un', (SELECT id FROM public.product_categories WHERE name = 'Ferramentas')),
  ('Resistor 220 Ohm', 'Pacote com 50 resistores de carbono.', 12.00, 7.00, 'Ambos', 'pct', (SELECT id FROM public.product_categories WHERE name = 'Componentes Eletrónicos')),
  ('Luvas de Proteção', 'Par de luvas de segurança, tamanho G.', 22.75, 14.00, 'Compra', 'par', (SELECT id FROM public.product_categories WHERE name = 'Equipamento de Segurança')),
  ('Tinta Branca Acrílica', 'Lata de 18 litros, para uso interno e externo.', 180.00, 135.00, 'Ambos', 'L', (SELECT id FROM public.product_categories WHERE name = 'Matéria-Prima')),
  ('Furadeira de Impacto 500W', 'Furadeira de impacto com velocidade variável e reversível.', 250.00, 190.00, 'Venda', 'un', (SELECT id FROM public.product_categories WHERE name = 'Ferramentas')),
  ('Capacitor Eletrolítico 1000uF', 'Capacitor 1000uF 25V.', 5.50, 2.50, 'Ambos', 'un', (SELECT id FROM public.product_categories WHERE name = 'Componentes Eletrónicos'))
ON CONFLICT (name) DO NOTHING;

