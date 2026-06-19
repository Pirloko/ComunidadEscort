-- ============================================================
-- 00009_rls_policies.sql
-- RLS FASE 1: regions, cities, profiles
-- (RLS de fases 3-7 en 00009b_rls_fases_3_7.sql)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_moderator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  )
$$;

-- REGIONS
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regions_select_all"
  ON regions FOR SELECT TO authenticated USING (true);

CREATE POLICY "regions_admin_all"
  ON regions FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- CITIES
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cities_select_active"
  ON cities FOR SELECT TO authenticated
  USING (is_active = true OR is_moderator_or_admin());

CREATE POLICY "cities_admin_all"
  ON cities FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT TO authenticated
  USING (is_active = true OR id = auth.uid() OR is_moderator_or_admin());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_all"
  ON profiles FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
