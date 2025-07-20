-- =================================================================
-- SCRIPT 6: DADOS EXPERIMENTAIS (SEED COMPLETO)
-- Popula as tabelas com dados fictícios para testes e desenvolvimento.
-- Execute este script no seu editor de SQL do Supabase.
-- =================================================================

-- Desabilitar RLS temporariamente para inserir dados como admin
ALTER TABLE public.entities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_expenses DISABLE ROW LEVEL SECURITY;
-- Adicione outras tabelas se necessário

DO $$
DECLARE
    -- IDs para Clientes
    cliente_joao_id UUID;
    cliente_maria_id UUID;
    cliente_agrocorp_id UUID;

    -- IDs para Fornecedores
    fornecedor_insumos_id UUID;
    fornecedor_ferramentas_id UUID;

    -- IDs para Funcionários/Vendedores
    vendedor_carlos_id UUID;
    vendedor_ana_id UUID;

    -- IDs para Produtos
    produto_semente_milho_id UUID;
    produto_fertilizante_id UUID;
    produto_trator_id UUID;
    produto_enxada_id UUID;

    -- IDs para Vendas
    venda_1_id UUID;
    venda_2_id UUID;
    venda_3_id UUID;
    venda_4_id UUID;

    -- IDs para Compras
    compra_1_id UUID;
    compra_2_id UUID;
BEGIN
    -- 1. INSERIR ENTIDADES (Pessoas e Empresas)
    -- Clientes
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type) VALUES ('João Silva', 'joao.silva@email.com', '74999887766', '101.222.333-44', 'Rua das Flores, 123, Irecê-BA', 'Pessoa') RETURNING id INTO cliente_joao_id;
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type) VALUES ('Maria Oliveira', 'maria.oliveira@email.com', '74988776655', '202.333.444-55', 'Avenida Principal, 456, Irecê-BA', 'Pessoa') RETURNING id INTO cliente_maria_id;
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type) VALUES ('AgroCorp Ltda', 'contato@agrocorp.com', '7436410000', '13.345.678/0001-99', 'Centro, Irecê-BA', 'Empresa') RETURNING id INTO cliente_agrocorp_id;

    -- Fornecedores
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type) VALUES ('Insumos Bahia', 'vendas@insumosbahia.com', '7436411111', '98.765.431/0001-11', 'Distrito Industrial, Irecê-BA', 'Empresa') RETURNING id INTO fornecedor_insumos_id;
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type) VALUES ('Ferramentas & Cia', 'comercial@ferramentascia.com', '7436412222', '11.222.443/0001-44', 'Rua do Comércio, 789, Irecê-BA', 'Empresa') RETURNING id INTO fornecedor_ferramentas_id;

    -- Funcionários (Vendedores)
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type) VALUES ('Carlos Souza', 'carlos.souza@email.com', '74999112233', '555.666.887-88', 'Bairro Novo, Irecê-BA', 'Pessoa') RETURNING id INTO vendedor_carlos_id;
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type) VALUES ('Ana Pereira', 'ana.pereira@email.com', '74988223344', '888.777.336-55', 'Bairro da Paz, Irecê-BA', 'Pessoa') RETURNING id INTO vendedor_ana_id;

    -- 2. ATRIBUIR PAPÉIS (Roles)
    INSERT INTO public.entity_roles (entity_id, role) VALUES (cliente_joao_id, 'Cliente') ON CONFLICT DO NOTHING;
    INSERT INTO public.entity_roles (entity_id, role) VALUES (cliente_maria_id, 'Cliente') ON CONFLICT DO NOTHING;
    INSERT INTO public.entity_roles (entity_id, role) VALUES (cliente_agrocorp_id, 'Cliente') ON CONFLICT DO NOTHING;
    INSERT INTO public.entity_roles (entity_id, role) VALUES (fornecedor_insumos_id, 'Fornecedor') ON CONFLICT DO NOTHING;
    INSERT INTO public.entity_roles (entity_id, role) VALUES (fornecedor_ferramentas_id, 'Fornecedor') ON CONFLICT DO NOTHING;
    INSERT INTO public.entity_roles (entity_id, role) VALUES (vendedor_carlos_id, 'Funcionário') ON CONFLICT DO NOTHING;
    INSERT INTO public.entity_roles (entity_id, role) VALUES (vendedor_ana_id, 'Funcionário') ON CONFLICT DO NOTHING;

    -- 3. INSERIR PRODUTOS
    INSERT INTO public.products (name, description, sale_price, purchase_price, unit_of_measure, category_id) VALUES ('Semente de Milho Híbrido (saco 20kg)', 'Semente de alta produtividade', 250.00, 180.00, 'sc', (SELECT id from product_categories WHERE name = 'Matéria-Prima')) RETURNING id INTO produto_semente_milho_id;
    INSERT INTO public.products (name, description, sale_price, purchase_price, unit_of_measure, category_id) VALUES ('Fertilizante NPK 20-05-20 (saco 50kg)', 'Fertilizante para plantio', 180.00, 130.00, 'sc', (SELECT id from product_categories WHERE name = 'Matéria-Prima')) RETURNING id INTO produto_fertilizante_id;
    INSERT INTO public.products (name, description, sale_price, purchase_price, unit_of_measure, category_id) VALUES ('Óleo Diesel S10', 'Combustível para máquinas', 6.50, 5.80, 'L', (SELECT id from product_categories WHERE name = 'Matéria-Prima')) RETURNING id INTO produto_trator_id;
    INSERT INTO public.products (name, description, sale_price, purchase_price, unit_of_measure, category_id) VALUES ('Enxada Larga', 'Ferramenta manual para capina', 45.00, 30.00, 'un', (SELECT id from product_categories WHERE name = 'Ferramentas')) RETURNING id INTO produto_enxada_id;

    -- 4. REGISTRAR COMPRAS (isso irá acionar o trigger de stock)
    -- Compra 1: Sementes e Fertilizantes (total 10.300,00)
    SELECT id INTO compra_1_id FROM public.create_purchase_with_items(
        fornecedor_insumos_id,
        (SELECT id FROM cost_centers WHERE name = 'Loja Física'),
        '[
            {"product_id": "'|| produto_semente_milho_id ||'", "quantity": 20, "unit_price": 180.00},
            {"product_id": "'|| produto_fertilizante_id ||'", "quantity": 50, "unit_price": 130.00}
        ]'::jsonb
    );
    -- Compra 2: Ferramentas (total 1.500,00)
    SELECT id INTO compra_2_id FROM public.create_purchase_with_items(
        fornecedor_ferramentas_id,
        (SELECT id FROM cost_centers WHERE name = 'Loja Física'),
        '[
            {"product_id": "'|| produto_enxada_id ||'", "quantity": 50, "unit_price": 30.00}
        ]'::jsonb
    );
    
    -- 5. REGISTRAR VENDAS (isso irá acionar o trigger de stock)
    -- Venda 1: João Silva, por Carlos (total 1.900,00) - PAGA
    SELECT id INTO venda_1_id FROM public.create_sale_with_items(
        cliente_joao_id,
        vendedor_carlos_id,
        (SELECT id FROM cost_centers WHERE name = 'Vendas Online'),
        5.0, -- comissão
        '[
            {"product_id": "'|| produto_semente_milho_id ||'", "quantity": 5, "unit_price": 250.00},
            {"product_id": "'|| produto_fertilizante_id ||'", "quantity": 3, "unit_price": 180.00}
        ]'::jsonb
    );
    -- Venda 2: Maria Oliveira, por Ana (total 715,00) - PARCIALMENTE PAGA
    SELECT id INTO venda_2_id FROM public.create_sale_with_items(
        cliente_maria_id,
        vendedor_ana_id,
        (SELECT id FROM cost_centers WHERE name = 'Loja Física'),
        5.0, -- comissão
        '[
            {"product_id": "'|| produto_fertilizante_id ||'", "quantity": 2, "unit_price": 180.00},
            {"product_id": "'|| produto_enxada_id ||'", "quantity": 5, "unit_price": 45.00}
        ]'::jsonb
    );
    -- Venda 3: AgroCorp, por Ana (total 5.000,00) - NÃO PAGA
    SELECT id INTO venda_3_id FROM public.create_sale_with_items(
        cliente_agrocorp_id,
        vendedor_ana_id,
        (SELECT id FROM cost_centers WHERE name = 'Loja Física'),
        3.0, -- comissão
        '[
            {"product_id": "'|| produto_semente_milho_id ||'", "quantity": 20, "unit_price": 250.00}
        ]'::jsonb
    );

    -- 6. REGISTRAR PAGAMENTOS
    -- Pagamento total da Venda 1
    INSERT INTO public.sale_payments (sale_id, amount_paid) VALUES (venda_1_id, 1790.00);
    -- Pagamento parcial da Venda 2
    INSERT INTO public.sale_payments (sale_id, amount_paid) VALUES (venda_2_id, 300.00);
    -- Pagamento parcial da Compra 1
    INSERT INTO public.purchase_payments (purchase_id, amount_paid) VALUES (compra_1_id, 5000.00);
    -- Pagamento total da Compra 2
    INSERT INTO public.purchase_payments (purchase_id, amount_paid) VALUES (compra_2_id, 1500.00);

    -- 7. REGISTRAR DESPESAS GERAIS
    INSERT INTO public.general_expenses (description, amount, category_id, cost_center_id, employee_id) VALUES
    ('Salário Carlos Souza', 2500.00, (SELECT id FROM expense_categories WHERE name = 'Salários'), (SELECT id FROM cost_centers WHERE name = 'Administrativo'), vendedor_carlos_id),
    ('Conta de Energia Elétrica', 850.50, (SELECT id FROM expense_categories WHERE name = 'Contas de Consumo (Água, Luz)'), (SELECT id FROM cost_centers WHERE name = 'Loja Física'), NULL),
    ('Anúncio Rádio Local', 300.00, (SELECT id FROM expense_categories WHERE name = 'Marketing e Publicidade'), (SELECT id FROM cost_centers WHERE name = 'Marketing'), NULL);

END $$;

-- Reabilitar RLS
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_expenses ENABLE ROW LEVEL SECURITY;
-- Adicione outras tabelas se necessário
