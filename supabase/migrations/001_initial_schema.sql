-- =============================================================================
-- 001_initial_schema.sql
-- FACODI – Initial database schema
--
-- Creates three schemas (catalog, subjects, mapping) and all tables required
-- for the FACODI static-MVP + Supabase architecture.
-- =============================================================================

-- ─── Schemas ─────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS subjects;
CREATE SCHEMA IF NOT EXISTS mapping;

-- ─── catalog.course ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS catalog.course (
  code                 TEXT    PRIMARY KEY,
  name                 TEXT    NOT NULL,
  degree               TEXT,
  ects_total           INTEGER,
  duration_semesters   INTEGER,
  plan_version         TEXT,
  institution          TEXT,
  school               TEXT,
  language             TEXT,
  summary              TEXT
);

COMMENT ON TABLE  catalog.course IS 'Top-level academic programme (e.g. LESTI).';
COMMENT ON COLUMN catalog.course.code IS 'Unique programme code used as slug (e.g. LESTI).';

-- ─── catalog.course_content ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS catalog.course_content (
  course_code TEXT PRIMARY KEY REFERENCES catalog.course (code) ON DELETE CASCADE,
  content_md  TEXT
);

COMMENT ON TABLE catalog.course_content IS 'Long-form Markdown body for a course page.';

-- ─── catalog.uc ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS catalog.uc (
  code          TEXT      PRIMARY KEY,
  course_code   TEXT      NOT NULL REFERENCES catalog.course (code) ON DELETE CASCADE,
  name          TEXT      NOT NULL,
  description   TEXT,
  ects          INTEGER,
  semester      INTEGER,
  language      TEXT,
  prerequisites TEXT[]    DEFAULT '{}'
);

COMMENT ON TABLE  catalog.uc IS 'Curricular Unit (Unidade Curricular).';
COMMENT ON COLUMN catalog.uc.prerequisites IS 'Array of UC codes that are prerequisites.';

-- ─── catalog.uc_content ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS catalog.uc_content (
  uc_code    TEXT PRIMARY KEY REFERENCES catalog.uc (code) ON DELETE CASCADE,
  content_md TEXT
);

COMMENT ON TABLE catalog.uc_content IS 'Long-form Markdown body for a UC page.';

-- ─── catalog.uc_learning_outcome ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS catalog.uc_learning_outcome (
  id       SERIAL  PRIMARY KEY,
  uc_code  TEXT    NOT NULL REFERENCES catalog.uc (code) ON DELETE CASCADE,
  outcome  TEXT    NOT NULL,
  "order"  INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE catalog.uc_learning_outcome IS 'Ordered learning outcomes for a UC.';

-- ─── subjects.topic ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subjects.topic (
  slug    TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  summary TEXT
);

COMMENT ON TABLE subjects.topic IS 'A reusable knowledge topic (cross-UC).';

-- ─── subjects.topic_content ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subjects.topic_content (
  topic_slug TEXT PRIMARY KEY REFERENCES subjects.topic (slug) ON DELETE CASCADE,
  content_md TEXT
);

COMMENT ON TABLE subjects.topic_content IS 'Long-form Markdown body for a topic page.';

-- ─── subjects.topic_tag ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subjects.topic_tag (
  topic_slug TEXT NOT NULL REFERENCES subjects.topic (slug) ON DELETE CASCADE,
  tag        TEXT NOT NULL,
  PRIMARY KEY (topic_slug, tag)
);

COMMENT ON TABLE subjects.topic_tag IS 'Tags associated with a topic.';

-- ─── mapping.uc_topic ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mapping.uc_topic (
  uc_code    TEXT NOT NULL REFERENCES catalog.uc   (code) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL REFERENCES subjects.topic(slug) ON DELETE CASCADE,
  PRIMARY KEY (uc_code, topic_slug)
);

COMMENT ON TABLE mapping.uc_topic IS 'Many-to-many: UC ↔ Topic.';

-- ─── mapping.uc_playlist ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mapping.uc_playlist (
  id          SERIAL PRIMARY KEY,
  uc_code     TEXT   NOT NULL REFERENCES catalog.uc (code) ON DELETE CASCADE,
  playlist_id TEXT   NOT NULL,
  priority    INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE mapping.uc_playlist IS 'YouTube playlists linked to a UC, ordered by priority.';

-- ─── mapping.topic_playlist ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mapping.topic_playlist (
  id          SERIAL PRIMARY KEY,
  topic_slug  TEXT   NOT NULL REFERENCES subjects.topic (slug) ON DELETE CASCADE,
  playlist_id TEXT   NOT NULL,
  priority    INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE mapping.topic_playlist IS 'YouTube playlists linked to a topic, ordered by priority.';
