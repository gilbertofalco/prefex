-- Execute no SQL Editor do Supabase se o cadastro falhar ao criar perfil

-- 1. Corrigir trigger (usa NULLIF para evitar erro de UUID vazio)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, professional_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NULLIF(NEW.raw_user_meta_data->>'professional_id', '')::uuid
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Permitir que usuário autenticado crie o próprio perfil (fallback)
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 3. Criar perfis para contas que já existem sem perfil
INSERT INTO profiles (id, role, full_name, professional_id)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'role', 'student'),
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  NULLIF(u.raw_user_meta_data->>'professional_id', '')::uuid
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
