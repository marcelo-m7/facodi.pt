-- =============================================================================
-- seed.sql
-- FACODI – Initial seed data
--
-- Inserts:
--   • 1 course  : LESTI 2024/2025
--   • 1 UC      : LESTI-ALG1 (Algoritmos e Estruturas de Dados, code 19411011)
--   • 2 topics  : analise-complexidade, estruturas-lineares
--   • dummy playlists for the UC and both topics
-- =============================================================================

-- ─── catalog.course ──────────────────────────────────────────────────────────

INSERT INTO catalog.course
  (code, name, degree, ects_total, duration_semesters, plan_version,
   institution, school, language, summary)
VALUES
  ('LESTI',
   'Licenciatura em Engenharia de Sistemas e Tecnologias da Informação',
   'bachelor',
   180,
   6,
   '2024/2025',
   'Universidade do Algarve',
   'Escola Superior de Tecnologia',
   'pt',
   'Plano 2024/2025 com formação sólida em matemática, computação, engenharia de software e projetos aplicados.')
ON CONFLICT (code) DO UPDATE
  SET name               = EXCLUDED.name,
      plan_version       = EXCLUDED.plan_version,
      summary            = EXCLUDED.summary;

INSERT INTO catalog.course_content (course_code, content_md)
VALUES
  ('LESTI',
   E'A licenciatura LESTI estrutura o plano 2024/2025 em seis semestres que equilibram bases científicas com competências nucleares de computação.\n\nAs unidades optativas permitem especialização, enquanto projetos em empresa e o estágio/projeto final consolidam a aplicação prática.')
ON CONFLICT (course_code) DO UPDATE
  SET content_md = EXCLUDED.content_md;

-- ─── catalog.uc ──────────────────────────────────────────────────────────────

INSERT INTO catalog.uc
  (code, course_code, name, description, ects, semester, language, prerequisites)
VALUES
  ('19411011',
   'LESTI',
   'Algoritmos e Estruturas de Dados',
   'Análise de complexidade, estruturas de dados fundamentais e algoritmos eficientes para resolução de problemas.',
   6,
   2,
   'pt',
   ARRAY['19411000', '19411006'])
ON CONFLICT (code) DO UPDATE
  SET name         = EXCLUDED.name,
      description  = EXCLUDED.description,
      ects         = EXCLUDED.ects,
      semester     = EXCLUDED.semester,
      prerequisites = EXCLUDED.prerequisites;

INSERT INTO catalog.uc_content (uc_code, content_md)
VALUES
  ('19411011',
   E'## Objetivo\n\nCapacitar os alunos na análise e implementação de algoritmos eficientes e estruturas de dados.\n\n## Metodologia\n\n- Aulas teóricas com visualizações\n- Laboratórios práticos em Java\n- Projetos aplicados')
ON CONFLICT (uc_code) DO UPDATE
  SET content_md = EXCLUDED.content_md;

-- Learning outcomes
INSERT INTO catalog.uc_learning_outcome (uc_code, outcome, "order") VALUES
  ('19411011', 'Analisar complexidade temporal e espacial usando Big-O',            1),
  ('19411011', 'Implementar estruturas de dados (listas, pilhas, filas, árvores)',  2),
  ('19411011', 'Aplicar algoritmos de ordenação e pesquisa adequadamente',          3),
  ('19411011', 'Usar grafos e algoritmos de grafos em problemas reais',             4),
  ('19411011', 'Otimizar soluções com estruturas de dados apropriadas',             5)
ON CONFLICT DO NOTHING;

-- ─── subjects.topic ──────────────────────────────────────────────────────────

INSERT INTO subjects.topic (slug, name, summary) VALUES
  ('analise-complexidade',  'Análise de Complexidade',  'Big-O, Theta, Omega notation'),
  ('estruturas-lineares',   'Estruturas Lineares',      'Arrays, listas ligadas, pilhas, filas')
ON CONFLICT (slug) DO UPDATE
  SET name    = EXCLUDED.name,
      summary = EXCLUDED.summary;

INSERT INTO subjects.topic_content (topic_slug, content_md) VALUES
  ('analise-complexidade',
   E'Estuda a notação assintótica (Big-O, Big-Theta, Big-Omega) e as técnicas de análise temporal e espacial de algoritmos.'),
  ('estruturas-lineares',
   E'Aborda arrays, listas ligadas simples, duplas e circulares, pilhas (LIFO) e filas (FIFO).')
ON CONFLICT (topic_slug) DO UPDATE
  SET content_md = EXCLUDED.content_md;

INSERT INTO subjects.topic_tag (topic_slug, tag) VALUES
  ('analise-complexidade', 'big-o'),
  ('analise-complexidade', 'complexidade'),
  ('estruturas-lineares',  'listas'),
  ('estruturas-lineares',  'pilhas'),
  ('estruturas-lineares',  'filas')
ON CONFLICT DO NOTHING;

-- ─── mapping.uc_topic ────────────────────────────────────────────────────────

INSERT INTO mapping.uc_topic (uc_code, topic_slug) VALUES
  ('19411011', 'analise-complexidade'),
  ('19411011', 'estruturas-lineares')
ON CONFLICT DO NOTHING;

-- ─── mapping.uc_playlist (dummy) ─────────────────────────────────────────────

INSERT INTO mapping.uc_playlist (uc_code, playlist_id, priority) VALUES
  ('19411011', 'PLqM7alHXFySHX34lUJEFVgJoWVV2Ley3V', 1),
  ('19411011', 'PL2_aW6pP2S96NrdbYIEKxr6P_5X_5HUHZ', 2)
ON CONFLICT DO NOTHING;

-- ─── mapping.topic_playlist (dummy) ──────────────────────────────────────────

INSERT INTO mapping.topic_playlist (topic_slug, playlist_id, priority) VALUES
  ('analise-complexidade', 'PLpPXw4zFqpH_aXEWIp_GY8zcsUVpfvCZ9', 1),
  ('estruturas-lineares',  'PLqM7alHXFySHX34lUJEFVgJoWVV2Ley3V', 1)
ON CONFLICT DO NOTHING;
