-- =================================================================
-- SCRIPT 16: FUNCIONALIDADE DE ANEXOS
-- Prepara o banco de dados e o armazenamento para permitir o upload
-- de ficheiros associados a compras e despesas.
-- =================================================================

-- 1. CRIAR O BUCKET DE ARMAZENAMENTO (STORAGE)
-- O bucket 'attachments' irá guardar todos os ficheiros.
-- A política de acesso público é definida como 'false' por segurança.
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;


-- 2. CRIAR A TABELA PARA GERIR OS ANEXOS
-- Esta tabela irá ligar os ficheiros do Storage a registos específicos.
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_id TEXT NOT NULL DEFAULT 'attachments',
    file_path TEXT NOT NULL UNIQUE, -- O caminho completo para o ficheiro no Storage
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES public.general_expenses(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Garante que um anexo está ligado a uma compra OU a uma despesa, mas não a ambos.
    CONSTRAINT purchase_or_expense_check CHECK (
        (purchase_id IS NOT NULL AND expense_id IS NULL) OR
        (purchase_id IS NULL AND expense_id IS NOT NULL)
    )
);


-- 3. ATIVAR A ROW LEVEL SECURITY NA NOVA TABELA
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;


-- 4. CRIAR POLÍTICAS DE SEGURANÇA PARA A TABELA 'attachments'
-- Apenas gestores e administradores podem ver e gerir os anexos.
CREATE POLICY "Allow manager and admin access to attachments"
ON public.attachments
FOR ALL
USING (get_my_role() IN ('admin', 'gestor'))
WITH CHECK (get_my_role() IN ('admin', 'gestor'));


-- 5. CRIAR POLÍTICAS DE SEGURANÇA PARA O BUCKET 'attachments' NO STORAGE
-- Estas regras controlam diretamente quem pode fazer upload, ver ou apagar os ficheiros.

-- Permite que gestores e admins vejam todos os ficheiros no bucket.
CREATE POLICY "Allow manager and admin to read attachments"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'attachments' AND
    get_my_role() IN ('admin', 'gestor')
);

-- Permite que gestores e admins insiram (façam upload) de novos ficheiros.
CREATE POLICY "Allow manager and admin to insert attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'attachments' AND
    get_my_role() IN ('admin', 'gestor')
);

-- Permite que gestores e admins apaguem ficheiros.
CREATE POLICY "Allow manager and admin to delete attachments"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'attachments' AND
    get_my_role() IN ('admin', 'gestor')
);

