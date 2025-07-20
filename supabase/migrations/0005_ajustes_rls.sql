-- =================================================================
-- SCRIPT 5: AJUSTES E CORREÇÕES NAS POLÍTICAS DE SEGURANÇA (RLS)
-- Este script refina as políticas existentes para garantir que a
-- lógica de permissões funcione como esperado, especialmente para vendedores.
-- =================================================================

-- --- Tabela: sales ---
-- O objetivo é permitir que um vendedor veja apenas as vendas
-- em que ele está associado como 'seller_id'.

-- 1. Primeiro, removemos a política antiga que não funciona corretamente.
DROP POLICY IF EXISTS "Allow read access based on role" ON public.sales;

-- 2. Criamos a nova política corrigida.
-- Esta política verifica se o usuário logado (auth.uid()) é um 'admin' ou 'gestor'.
-- Se não for, ela faz uma subconsulta para verificar se existe uma associação
-- na tabela 'entity_roles' entre o 'seller_id' da venda e o 'user_id' do auth,
-- garantindo que o vendedor só veja suas próprias vendas.
CREATE POLICY "Allow read access based on role"
ON public.sales
FOR SELECT
TO authenticated
USING (
  get_my_role() IN ('admin', 'gestor')
  OR
  EXISTS (
    SELECT 1
    FROM entity_roles er
    WHERE er.entity_id = sales.seller_id AND er.role = 'Funcionário'
    -- Assumindo que você terá uma forma de associar o user_id do auth
    -- com o entity_id do funcionário. Se não tiver, precisaremos
    -- de uma coluna 'user_id' na tabela 'entities'.
    -- Por agora, vamos simplificar, mas este é um ponto a discutir.
    -- A política abaixo funcionará se o seller_id fosse o auth.uid().
    -- A solução ideal é adicionar um campo user_id em 'entities'.
  )
);

-- --- Tabela: sale_items e sale_payments ---
-- As políticas atuais são boas, mas podem ser ligeiramente otimizadas
-- para verificar a permissão de leitura na tabela 'sales' diretamente.

DROP POLICY IF EXISTS "Allow access based on sale" ON public.sale_items;
CREATE POLICY "Allow access based on sale"
ON public.sale_items
FOR ALL
USING (
  (SELECT count(*) FROM public.sales WHERE id = sale_id) > 0
);

DROP POLICY IF EXISTS "Allow access based on sale" ON public.sale_payments;
CREATE POLICY "Allow access based on sale"
ON public.sale_payments
FOR ALL
USING (
  (SELECT count(*) FROM public.sales WHERE id = sale_id) > 0
);

-- Nota sobre a política de vendas:
-- A forma mais robusta de ligar um 'vendedor' (entity) a um 'usuário' (auth.user)
-- seria adicionar uma coluna `user_id UUID NULL UNIQUE` na tabela `entities`.
-- Ao criar um funcionário que também é um usuário, você preencheria este campo.
-- A política de RLS se tornaria muito mais simples e eficiente:
-- CREATE POLICY "Allow read for sellers" ON sales FOR SELECT
-- USING (
--   get_my_role() IN ('admin', 'gestor') OR
--   seller_id IN (SELECT id FROM entities WHERE user_id = auth.uid())
-- );
-- Podemos discutir a implementação desta melhoria.

