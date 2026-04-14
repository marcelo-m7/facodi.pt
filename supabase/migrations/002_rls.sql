-- =============================================================================
-- 002_rls.sql
-- FACODI – Row-Level Security policies
--
-- • All tables have RLS enabled.
-- • The `anon` role (public browser) may only SELECT.
-- • INSERT / UPDATE / DELETE are restricted to the `service_role`
--   (used by the CI sync script, never exposed to the browser).
-- =============================================================================

-- ─── Helper: enable RLS ──────────────────────────────────────────────────────

ALTER TABLE catalog.course              ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.course_content      ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.uc                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.uc_content          ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.uc_learning_outcome ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects.topic              ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects.topic_content      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects.topic_tag          ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapping.uc_topic            ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapping.uc_playlist         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapping.topic_playlist      ENABLE ROW LEVEL SECURITY;

-- ─── Public SELECT (anon role) ───────────────────────────────────────────────

CREATE POLICY "anon_select" ON catalog.course
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select" ON catalog.course_content
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select" ON catalog.uc
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select" ON catalog.uc_content
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select" ON catalog.uc_learning_outcome
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select" ON subjects.topic
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select" ON subjects.topic_content
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select" ON subjects.topic_tag
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select" ON mapping.uc_topic
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select" ON mapping.uc_playlist
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select" ON mapping.topic_playlist
  FOR SELECT TO anon USING (true);

-- ─── Service-role write access ───────────────────────────────────────────────
-- The service role bypasses RLS by default in Supabase, but we add explicit
-- policies for documentation and to support future auth configurations.

CREATE POLICY "service_role_all" ON catalog.course
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON catalog.course_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON catalog.uc
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON catalog.uc_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON catalog.uc_learning_outcome
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON subjects.topic
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON subjects.topic_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON subjects.topic_tag
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON mapping.uc_topic
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON mapping.uc_playlist
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON mapping.topic_playlist
  FOR ALL TO service_role USING (true) WITH CHECK (true);
