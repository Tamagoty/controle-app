-- // supabase/migrations/0003_triggers.sql
-- =================================================================
-- SCRIPT 3: TRIGGERS
-- Define todos os triggers para automações no banco de dados.
-- =================================================================

-- Trigger para atualizar o campo 'updated_at' da tabela de perfis
CREATE OR REPLACE TRIGGER on_profile_update
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION handle_profile_update();

-- Triggers para atualizar o stock de produtos
CREATE OR REPLACE TRIGGER on_purchase_item_insert
AFTER INSERT ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION handle_stock_change();

CREATE OR REPLACE TRIGGER on_sale_item_insert
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION handle_stock_change();
