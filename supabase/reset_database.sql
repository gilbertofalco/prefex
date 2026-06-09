-- PREFEX — Reset do banco (use SOMENTE se quiser recomeçar do zero)
-- Apaga tabelas, políticas e funções do app. NÃO apaga usuários do Auth.
--
-- Passos:
--   1. Execute ESTE arquivo no SQL Editor
--   2. Execute migrations/001_initial_schema.sql em seguida
--   3. Cadastre-se novamente em /register (ou rode o backfill no final do 001)

-- Políticas RLS
DROP POLICY IF EXISTS "activities_select_all" ON activities;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_students" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_students" ON profiles;
DROP POLICY IF EXISTS "results_select_own" ON activity_results;
DROP POLICY IF EXISTS "results_insert_own" ON activity_results;
DROP POLICY IF EXISTS "results_select_professional" ON activity_results;
DROP POLICY IF EXISTS "drafts_select_own" ON activity_drafts;
DROP POLICY IF EXISTS "drafts_insert_own" ON activity_drafts;
DROP POLICY IF EXISTS "drafts_update_own" ON activity_drafts;
DROP POLICY IF EXISTS "drafts_delete_own" ON activity_drafts;

-- Trigger e funções
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.ensure_user_profile();

-- Tabelas (ordem por dependência)
DROP TABLE IF EXISTS activity_drafts CASCADE;
DROP TABLE IF EXISTS activity_results CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
