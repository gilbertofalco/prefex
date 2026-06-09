-- PREFEX Platform - Initial Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('professional', 'student')),
  full_name TEXT NOT NULL,
  professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  avatar_color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activities catalog
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  config_schema JSONB DEFAULT '{}'::jsonb
);

-- Activity results
CREATE TABLE IF NOT EXISTS activity_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  duration_ms INT NOT NULL,
  score_percent NUMERIC(5,2) NOT NULL,
  total_items INT NOT NULL,
  correct_items INT NOT NULL,
  error_count INT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity drafts (server-side backup)
CREATE TABLE IF NOT EXISTS activity_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, activity_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_professional_id ON profiles(professional_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_activity_results_student_id ON activity_results(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_results_activity_id ON activity_results(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_results_completed_at ON activity_results(completed_at DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, professional_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    (NEW.raw_user_meta_data->>'professional_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_drafts ENABLE ROW LEVEL SECURITY;

-- Activities: everyone authenticated can read
CREATE POLICY "activities_select_all" ON activities
  FOR SELECT TO authenticated USING (true);

-- Profiles: users can read own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

-- Professionals can read their students
CREATE POLICY "profiles_select_students" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'professional'
    )
    AND professional_id = auth.uid()
  );

-- Users can update own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Professionals can insert student profiles (via trigger on auth.users)
CREATE POLICY "profiles_insert_students" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    role = 'student'
    AND professional_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'professional')
  );

-- Activity results: students insert/select own
CREATE POLICY "results_select_own" ON activity_results
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "results_insert_own" ON activity_results
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- Professionals select results of their students
CREATE POLICY "results_select_professional" ON activity_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles s
      WHERE s.id = activity_results.student_id
        AND s.professional_id = auth.uid()
    )
  );

-- Activity drafts: students manage own
CREATE POLICY "drafts_select_own" ON activity_drafts
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "drafts_insert_own" ON activity_drafts
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "drafts_update_own" ON activity_drafts
  FOR UPDATE TO authenticated USING (student_id = auth.uid());

CREATE POLICY "drafts_delete_own" ON activity_drafts
  FOR DELETE TO authenticated USING (student_id = auth.uid());

-- Seed activities
INSERT INTO activities (id, category, title, description, difficulty, is_active, config_schema) VALUES
  ('visuomotor-matrix', 'coordenacao_visomotora', 'Matriz de Círculos', 'Replique o padrão de círculos preenchidos no quadro da direita.', 1, true, '{"rows": 4, "cols": 4, "fillRatio": 0.4}'),
  ('sequence-simon', 'sequencia', 'Sequência Simon', 'Memorize e repita a sequência de cores e posições.', 2, true, '{"rounds": 5, "pads": 4}'),
  ('classification-sort', 'classificacao', 'Classificação', 'Arraste os cartões para a categoria correta.', 1, true, '{"items": 8}'),
  ('attention-nback', 'atencao_memoria', 'N-Back', 'Identifique quando o estímulo atual é igual ao anterior.', 3, false, '{}'),
  ('logic-patterns', 'raciocinio_logico', 'Padrões Lógicos', 'Complete a sequência lógica de formas.', 2, false, '{}')
ON CONFLICT (id) DO NOTHING;
