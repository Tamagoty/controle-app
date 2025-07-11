-- =================================================================
-- SCRIPT DE POPULAÇÃO (SEED) - PESSOAS & EMPRESAS
-- =================================================================
-- Este script insere dados de exemplo nas tabelas 'entities' e 'entity_roles'.
-- É seguro executá-lo múltiplas vezes.

-- 1. Inserir as Entidades (Pessoas e Empresas)
INSERT INTO public.entities (name, email, phone, document_number, address, entity_type)
VALUES
  ('Maria da Silva', 'maria.silva@email.com', '(74) 99911-2233', '111.222.333-44', 'Rua das Flores, 10, Irecê, BA', 'Pessoa'),
  ('João Pereira', 'joao.vendedor@email.com', '(74) 98822-3344', '222.333.444-55', 'Avenida Principal, 20, Irecê, BA', 'Pessoa'),
  ('Ana Costa', 'ana.costa@email.com', '(11) 97733-4455', '333.444.555-66', 'Rua dos Investidores, 30, São Paulo, SP', 'Pessoa'),
  ('Fornecedora de Metais S.A.', 'contato@metais.com', '(11) 4004-5005', '11.222.333/0001-44', 'Distrito Industrial, 40, São Paulo, SP', 'Empresa'),
  ('Construtora Rocha Forte Ltda.', 'compras@rochaforte.com', '(71) 3344-5566', '22.333.444/0001-55', 'Avenida Oceânica, 50, Salvador, BA', 'Empresa'),
  ('Soluções em TI ME', 'suporte@solucoesti.com', '(74) 3641-9988', '33.444.555/0001-66', 'Centro, Rua da Matriz, 60, Irecê, BA', 'Empresa')
ON CONFLICT (email) DO NOTHING;


-- 2. Atribuir os Papéis a cada Entidade
-- Maria da Silva -> Cliente
INSERT INTO public.entity_roles (entity_id, role)
SELECT id, 'Cliente' FROM public.entities WHERE email = 'maria.silva@email.com'
ON CONFLICT (entity_id, role) DO NOTHING;

-- João Pereira -> Funcionário
INSERT INTO public.entity_roles (entity_id, role)
SELECT id, 'Funcionário' FROM public.entities WHERE email = 'joao.vendedor@email.com'
ON CONFLICT (entity_id, role) DO NOTHING;

-- Ana Costa -> Sócio
INSERT INTO public.entity_roles (entity_id, role)
SELECT id, 'Sócio' FROM public.entities WHERE email = 'ana.costa@email.com'
ON CONFLICT (entity_id, role) DO NOTHING;

-- Fornecedora de Metais S.A. -> Fornecedor
INSERT INTO public.entity_roles (entity_id, role)
SELECT id, 'Fornecedor' FROM public.entities WHERE email = 'contato@metais.com'
ON CONFLICT (entity_id, role) DO NOTHING;

-- Construtora Rocha Forte Ltda. -> Cliente
INSERT INTO public.entity_roles (entity_id, role)
SELECT id, 'Cliente' FROM public.entities WHERE email = 'compras@rochaforte.com'
ON CONFLICT (entity_id, role) DO NOTHING;

-- Soluções em TI ME -> Cliente e Fornecedor
INSERT INTO public.entity_roles (entity_id, role)
SELECT id, 'Cliente' FROM public.entities WHERE email = 'suporte@solucoesti.com'
ON CONFLICT (entity_id, role) DO NOTHING;
INSERT INTO public.entity_roles (entity_id, role)
SELECT id, 'Fornecedor' FROM public.entities WHERE email = 'suporte@solucoesti.com'
ON CONFLICT (entity_id, role) DO NOTHING;
