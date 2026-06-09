-- Garante perfil no login (contorna falhas de trigger/RLS)
-- Execute no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  meta jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  RETURN QUERY SELECT * FROM public.profiles WHERE id = uid;
  IF FOUND THEN
    RETURN;
  END IF;

  SELECT raw_user_meta_data INTO meta FROM auth.users WHERE id = uid;

  INSERT INTO public.profiles (id, role, full_name, professional_id)
  VALUES (
    uid,
    COALESCE(meta->>'role', 'student'),
    COALESCE(meta->>'full_name', (SELECT email FROM auth.users WHERE id = uid)),
    NULLIF(meta->>'professional_id', '')::uuid
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN QUERY SELECT * FROM public.profiles WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;

-- Recria perfis faltantes para contas existentes
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
