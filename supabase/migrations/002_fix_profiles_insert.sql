-- Corrige perfis ausentes e permite que o usuário crie o próprio perfil se o trigger falhar

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Cria perfis para usuários auth que ainda não têm linha em profiles
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
