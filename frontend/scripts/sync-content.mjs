#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import toml from 'toml';
import { createClient } from '@supabase/supabase-js';

const CONTENT_ROOT = path.resolve('content');
const LANG_CONFIG_PATH = path.resolve('config', '_default', 'languages.toml');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Defina SUPABASE_URL e SUPABASE_SERVICE_KEY para sincronizar o conteúdo.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  },
});

const courseRecords = [];
const courseContents = [];
const ucRecords = [];
const ucContents = [];
const ucOutcomes = [];
const ucPlaylists = [];
const ucTopics = [];
const topicRecords = [];
const topicContents = [];
const topicTags = [];
const topicPlaylists = [];

function toPosix(p) {
  return p.split(path.sep).join('/');
}

async function loadLanguageDirs() {
  try {
    const raw = await fs.readFile(LANG_CONFIG_PATH, 'utf8');
    const parsed = toml.parse(raw);
    const entries = Object.entries(parsed || {});
    if (!entries.length) {
      return [{ code: 'default', absDir: CONTENT_ROOT }];
    }
    return entries.map(([code, config]) => {
      const relDir = config && config.contentDir ? config.contentDir : 'content';
      return { code, absDir: path.resolve(relDir) };
    });
  } catch (err) {
    console.warn(`[FACODI] Não foi possível ler ${LANG_CONFIG_PATH}: ${err.message}`);
    return [{ code: 'default', absDir: CONTENT_ROOT }];
  }
}

async function walk(dir, langCode, baseDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, langCode, baseDir);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      await parseMarkdown(fullPath, langCode, baseDir);
    }
  }
}

function normalizePlanFromDir(dirName) {
  if (!dirName) return dirName;
  if (dirName.includes('/')) return dirName;
  return dirName.replace('-', '/');
}

async function parseMarkdown(fullPath, langCode, baseDir) {
  const relPath = toPosix(path.relative(baseDir, fullPath));

  const raw = await fs.readFile(fullPath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data || {};
  const content = parsed.content.trim();

  const normalizedLanguage = data.language || (langCode && langCode !== 'default' ? langCode : null);

  if (/^courses\/[^/]+\/[^/]+\/index\.md$/i.test(relPath)) {
    const segments = relPath.split('/');
    const codeFromPath = segments[1];
    const planDir = segments[2];
    const record = {
      code: data.code || codeFromPath,
      plan_version: data.plan_version || normalizePlanFromDir(planDir),
      name: data.title || '',
      degree: data.degree || '',
      ects_total: data.ects_total ?? null,
      duration_semesters: data.duration_semesters ?? null,
      institution: data.institution || null,
      school: data.school || null,
      language: normalizedLanguage,
      summary: data.summary || null,
    };
    courseRecords.push(record);
    courseContents.push({
      course_code: record.code,
      plan_version: record.plan_version,
      content_md: content,
    });
  } else if (/^courses\/[^/]+\/[^/]+\/uc\/[^/]+\/index\.md$/i.test(relPath)) {
    const segments = relPath.split('/');
    const courseCodeFromPath = segments[1];
    const planDir = segments[2];
    const ucCodeFromPath = segments[4];
    const planVersion = normalizePlanFromDir(data.plan_version || planDir);
    const courseCode = data.course_code || courseCodeFromPath;

    ucRecords.push({
      code: data.code || ucCodeFromPath,
      course_code: courseCode,
      course_plan_version: planVersion,
      name: data.title || '',
      description: data.description || null,
      ects: data.ects ?? null,
      semester: data.semester ?? null,
      language: normalizedLanguage,
      prerequisites: Array.isArray(data.prerequisites) ? data.prerequisites : [],
    });

    ucContents.push({
      uc_code: data.code || ucCodeFromPath,
      content_md: content,
    });

    if (Array.isArray(data.learning_outcomes)) {
      data.learning_outcomes.forEach((outcome, index) => {
        if (typeof outcome === 'string' && outcome.trim().length > 0) {
          ucOutcomes.push({
            uc_code: data.code || ucCodeFromPath,
            outcome,
            order: index + 1,
          });
        }
      });
    }

    if (Array.isArray(data.youtube_playlists)) {
      data.youtube_playlists.forEach((playlist) => {
        if (playlist && playlist.id) {
          ucPlaylists.push({
            uc_code: data.code || ucCodeFromPath,
            playlist_id: playlist.id,
            priority: playlist.priority ?? null,
          });
        }
      });
    }

    if (Array.isArray(data.topics)) {
      data.topics.forEach((topic) => {
        const slug = typeof topic === 'string' ? topic : topic && topic.slug;
        if (slug) {
          ucTopics.push({
            uc_code: data.code || ucCodeFromPath,
            topic_slug: slug,
          });
        }
      });
    }
  } else if (/^courses\/[^/]+\/[^/]+\/uc\/[^/]+\/[^/]+\.md$/i.test(relPath)) {
    const fileName = path.basename(relPath);
    if (fileName.toLowerCase() === 'index.md') {
      return;
    }
    const segments = relPath.split('/');
    const ucCodeFromPath = segments[4];
    const slugFromPath = fileName.replace(/\.md$/, '');

    const slug = data.slug || slugFromPath;
    topicRecords.push({
      slug,
      name: data.title || slug,
      summary: data.summary || null,
    });

    topicContents.push({
      topic_slug: slug,
      content_md: content,
    });

    if (Array.isArray(data.tags)) {
      data.tags.forEach((tag) => {
        if (typeof tag === 'string' && tag.trim().length > 0) {
          topicTags.push({ topic_slug: slug, tag });
        }
      });
    }

    if (Array.isArray(data.youtube_playlists)) {
      data.youtube_playlists.forEach((playlist) => {
        if (playlist && playlist.id) {
          topicPlaylists.push({
            topic_slug: slug,
            playlist_id: playlist.id,
            priority: playlist.priority ?? null,
          });
        }
      });
    }
  }
}

async function upsert(table, rows, options = {}) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, options);
  if (error) {
    throw new Error(`Erro ao sincronizar ${table}: ${error.message}`);
  }
}

async function insert(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    throw new Error(`Erro ao inserir em ${table}: ${error.message}`);
  }
}

async function purge(table, column, values) {
  if (!values.length) return;
  for (const value of values) {
    const { error } = await supabase.from(table).delete().eq(column, value);
    if (error) {
      throw new Error(`Erro ao limpar ${table} (${column}=${value}): ${error.message}`);
    }
  }
}

async function main() {
  const languages = await loadLanguageDirs();
  for (const lang of languages) {
    try {
      const stats = await fs.stat(lang.absDir);
      if (!stats.isDirectory()) {
        console.warn(`[FACODI] Caminho ignorado (não é diretório): ${lang.absDir}`);
        continue;
      }
      await walk(lang.absDir, lang.code, lang.absDir);
    } catch (err) {
      console.warn(`[FACODI] Não foi possível processar ${lang.absDir}: ${err.message}`);
    }
  }

  console.log('🔄 Iniciando sincronização com Supabase…');

  await upsert('catalog.course', courseRecords, { onConflict: 'code,plan_version' });
  await upsert('catalog.course_content', courseContents, { onConflict: 'course_code,plan_version' });
  await upsert('catalog.uc', ucRecords, { onConflict: 'code' });
  await upsert('catalog.uc_content', ucContents, { onConflict: 'uc_code' });
  await upsert('subjects.topic', topicRecords, { onConflict: 'slug' });
  await upsert('subjects.topic_content', topicContents, { onConflict: 'topic_slug' });

  const ucCodes = [...new Set(ucRecords.map((uc) => uc.code))];
  await purge('catalog.uc_learning_outcome', 'uc_code', ucCodes);
  await purge('mapping.uc_playlist', 'uc_code', ucCodes);
  await purge('mapping.uc_topic', 'uc_code', ucCodes);

  await insert('catalog.uc_learning_outcome', ucOutcomes);
  await insert('mapping.uc_playlist', ucPlaylists);
  await insert('mapping.uc_topic', ucTopics);

  const topicSlugs = [...new Set(topicRecords.map((topic) => topic.slug))];
  await purge('subjects.topic_tag', 'topic_slug', topicSlugs);
  await purge('mapping.topic_playlist', 'topic_slug', topicSlugs);

  await insert('subjects.topic_tag', topicTags);
  await insert('mapping.topic_playlist', topicPlaylists);

  console.log('✅ Sincronização concluída com sucesso.');
}

main().catch((err) => {
  console.error('❌ Falha na sincronização:', err.message);
  process.exit(1);
});
