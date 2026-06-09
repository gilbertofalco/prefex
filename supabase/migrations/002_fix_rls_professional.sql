-- Corrige RLS recursivo: profissional não conseguia listar alunos nem cadastrar via Edge Function

CREATE OR REPLACE FUNCTION public.is_professional()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'professional'
  );
$$;

REVOKE ALL ON FUNCTION public.is_professional() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_professional() TO authenticated;

DROP POLICY IF EXISTS "profiles_select_students" ON profiles;
CREATE POLICY "profiles_select_students" ON profiles
  FOR SELECT TO authenticated
  USING (public.is_professional() AND professional_id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_students" ON profiles;
CREATE POLICY "profiles_insert_students" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    role = 'student'
    AND professional_id = auth.uid()
    AND public.is_professional()
  );
