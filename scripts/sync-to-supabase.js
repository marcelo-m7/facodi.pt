#!/usr/bin/env node
/**
 * scripts/sync-to-supabase.js
 *
 * Reads all Markdown files under content/courses/ and upserts their
 * front matter and body into the Supabase database.
 *
 * Required environment variables:
 *   SUPABASE_URL          – project URL (e.g. https://xxx.supabase.co)
 *   SUPABASE_SERVICE_KEY  – service role key (never exposed to the browser)
 *
 * Usage:
 *   node scripts/sync-to-supabase.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ─── Configuration ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'courses');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse YAML-style front matter from a Markdown string.
 * Returns { data, body } where `data` is a plain object and `body` is the
 * content after the closing `---` delimiter.
 *
 * Supports TOML-style arrays (`["a", "b"]`) and inline objects as well as
 * YAML scalars, lists and nested keys used in this project's front matter.
 *
 * @param {string} source
 * @returns {{ data: Record<string, unknown>, body: string }}
 */
function parseFrontMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: source };

  const raw = match[1];
  const body = match[2].trim();
  const data = {};

  // Very small YAML subset parser – enough for this project's front matter.
  // Supports scalars, quoted strings, arrays (block and inline), and
  // mapping sequences (- key: val) used for learning_outcomes, playlists, topics.
  const lines = raw.split(/\r?\n/);
  let i = 0;

  const parseValue = (raw) => {
    const v = raw.trim();
    if (v === 'true') return true;
    if (v === 'false') return false;
    const num = Number(v);
    if (!isNaN(num) && v !== '') return num;
    // Quoted string
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
    // Inline array
    if (v.startsWith('[')) {
      try {
        return JSON.parse(v.replace(/'/g, '"'));
      } catch {
        return v;
      }
    }
    return v;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Top-level key: value
    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2].trim();

      if (val === '' || val === null) {
        // Could be a block (array or mapping sequence)
        const items = [];
        i++;
        while (i < lines.length && /^\s+-/.test(lines[i])) {
          const itemLine = lines[i].trim().replace(/^-\s*/, '');
          // Is it a mapping?
          if (itemLine.includes(':')) {
            const obj = {};
            // First key in the same line
            const firstKv = itemLine.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
            if (firstKv) obj[firstKv[1]] = parseValue(firstKv[2]);
            // Continuation lines with deeper indentation
            i++;
            while (i < lines.length && /^\s{4,}/.test(lines[i])) {
              const subLine = lines[i].trim();
              const subKv = subLine.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
              if (subKv) obj[subKv[1]] = parseValue(subKv[2]);
              i++;
            }
            items.push(obj);
          } else {
            items.push(parseValue(itemLine));
            i++;
          }
        }
        data[key] = items;
        continue;
      }

      data[key] = parseValue(val);
    }
    i++;
  }

  return { data, body };
}

/**
 * Recursively walk a directory and return all file paths.
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

// ─── Upsert helpers ──────────────────────────────────────────────────────────

async function upsert(schema, table, row) {
  const { error } = await db.schema(schema).from(table).upsert(row, { onConflict: 'code' });
  if (error) throw new Error(`upsert ${schema}.${table}: ${error.message}`);
}

async function upsertPk(schema, table, row, pk = 'code') {
  const { error } = await db.schema(schema).from(table).upsert(row, { onConflict: pk });
  if (error) throw new Error(`upsert ${schema}.${table}: ${error.message}`);
}

// ─── Sync functions ───────────────────────────────────────────────────────────

/**
 * Sync a course index file (_index.md at the course level).
 * @param {string} filePath
 * @param {string} courseSlug
 */
async function syncCourse(filePath, courseSlug) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const { data, body } = parseFrontMatter(source);

  const courseRow = {
    code: data.code || courseSlug.toUpperCase(),
    name: data.title || '',
    degree: data.degree || null,
    ects_total: data.ects_total || null,
    duration_semesters: data.duration_semesters || null,
    plan_version: data.plan_version || null,
    institution: data.institution || null,
    school: data.school || null,
    language: data.language || null,
    summary: data.summary || null,
  };

  await upsertPk('catalog', 'course', courseRow, 'code');
  console.log(`  ✓ course ${courseRow.code}`);

  if (body) {
    const { error } = await db.schema('catalog').from('course_content').upsert(
      { course_code: courseRow.code, content_md: body },
      { onConflict: 'course_code' }
    );
    if (error) throw new Error(`upsert catalog.course_content: ${error.message}`);
  }
}

/**
 * Sync a UC index file (_index.md at the UC level).
 * @param {string} filePath
 * @param {string} courseCode
 */
async function syncUC(filePath, courseCode) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const { data, body } = parseFrontMatter(source);

  const ucCode = data.code || path.basename(path.dirname(filePath));

  const ucRow = {
    code: ucCode,
    course_code: courseCode,
    name: data.title || '',
    description: data.description || null,
    ects: data.ects || null,
    semester: data.semester || null,
    language: data.language || null,
    prerequisites: Array.isArray(data.prerequisites) ? data.prerequisites : [],
  };

  await upsertPk('catalog', 'uc', ucRow, 'code');
  console.log(`    ✓ uc ${ucCode}`);

  // UC content
  if (body) {
    const { error } = await db.schema('catalog').from('uc_content').upsert(
      { uc_code: ucCode, content_md: body },
      { onConflict: 'uc_code' }
    );
    if (error) throw new Error(`upsert catalog.uc_content: ${error.message}`);
  }

  // Learning outcomes
  if (Array.isArray(data.learning_outcomes) && data.learning_outcomes.length) {
    // Delete existing then re-insert (simple strategy)
    await db.schema('catalog').from('uc_learning_outcome').delete().eq('uc_code', ucCode);
    const rows = data.learning_outcomes.map((lo, idx) => ({
      uc_code: ucCode,
      outcome: typeof lo === 'string' ? lo : lo.outcome || '',
      order: typeof lo === 'object' && lo.order != null ? lo.order : idx + 1,
    }));
    const { error } = await db.schema('catalog').from('uc_learning_outcome').insert(rows);
    if (error) throw new Error(`insert uc_learning_outcome: ${error.message}`);
  }

  // Playlists
  if (Array.isArray(data.playlists) && data.playlists.length) {
    await db.schema('mapping').from('uc_playlist').delete().eq('uc_code', ucCode);
    const rows = data.playlists.map((p, idx) => ({
      uc_code: ucCode,
      playlist_id: p.id || String(p),
      priority: p.priority != null ? p.priority : idx + 1,
    }));
    const { error } = await db.schema('mapping').from('uc_playlist').insert(rows);
    if (error) throw new Error(`insert uc_playlist: ${error.message}`);
  }

  // Topics referenced in the UC front matter
  if (Array.isArray(data.topics) && data.topics.length) {
    for (const topic of data.topics) {
      const slug = topic.slug || topic;
      if (!slug) continue;

      // Ensure the topic exists in subjects.topic
      await db.schema('subjects').from('topic').upsert(
        {
          slug,
          name: topic.name || slug,
          summary: topic.summary || null,
        },
        { onConflict: 'slug' }
      );

      // Map UC → topic
      await db.schema('mapping').from('uc_topic').upsert(
        { uc_code: ucCode, topic_slug: slug },
        { onConflict: 'uc_code,topic_slug' }
      );
    }
  }
}

/**
 * Sync a topic file (non-index .md inside a UC directory).
 * @param {string} filePath
 */
async function syncTopic(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const { data, body } = parseFrontMatter(source);

  const slug = data.slug || path.basename(filePath, '.md');

  await db.schema('subjects').from('topic').upsert(
    { slug, name: data.title || slug, summary: data.summary || null },
    { onConflict: 'slug' }
  );
  console.log(`      ✓ topic ${slug}`);

  // Topic content
  if (body) {
    const { error } = await db.schema('subjects').from('topic_content').upsert(
      { topic_slug: slug, content_md: body },
      { onConflict: 'topic_slug' }
    );
    if (error) throw new Error(`upsert topic_content: ${error.message}`);
  }

  // Tags
  if (Array.isArray(data.tags) && data.tags.length) {
    await db.schema('subjects').from('topic_tag').delete().eq('topic_slug', slug);
    const rows = data.tags.map((tag) => ({ topic_slug: slug, tag: String(tag) }));
    const { error } = await db.schema('subjects').from('topic_tag').insert(rows);
    if (error) throw new Error(`insert topic_tag: ${error.message}`);
  }

  // Playlists from youtube_playlists front matter
  const pl = data.youtube_playlists || data.playlists;
  if (Array.isArray(pl) && pl.length) {
    await db.schema('mapping').from('topic_playlist').delete().eq('topic_slug', slug);
    const rows = pl.map((p, idx) => ({
      topic_slug: slug,
      playlist_id: p.id || String(p),
      priority: p.priority != null ? p.priority : idx + 1,
    }));
    const { error } = await db.schema('mapping').from('topic_playlist').insert(rows);
    if (error) throw new Error(`insert topic_playlist: ${error.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔄  Syncing Markdown → Supabase...\n');

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌  content/courses directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const courseDirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const courseSlug of courseDirs) {
    const courseDir = path.join(CONTENT_DIR, courseSlug);
    const courseIndex = path.join(courseDir, '_index.md');

    if (!fs.existsSync(courseIndex)) {
      console.warn(`  ⚠  No _index.md for course ${courseSlug}, skipping.`);
      continue;
    }

    console.log(`📚  Course: ${courseSlug}`);
    await syncCourse(courseIndex, courseSlug);

    const ucDir = path.join(courseDir, 'uc');
    if (!fs.existsSync(ucDir)) continue;

    const ucDirs = fs.readdirSync(ucDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    // Determine course code from the parsed index
    const source = fs.readFileSync(courseIndex, 'utf-8');
    const { data: courseData } = parseFrontMatter(source);
    const courseCode = courseData.code || courseSlug.toUpperCase();

    for (const ucSlug of ucDirs) {
      const ucPath = path.join(ucDir, ucSlug);
      const ucIndex = path.join(ucPath, '_index.md');

      if (!fs.existsSync(ucIndex)) {
        console.warn(`    ⚠  No _index.md for UC ${ucSlug}, skipping.`);
        continue;
      }

      await syncUC(ucIndex, courseCode);

      // Topic files within the UC directory
      const topicFiles = fs.readdirSync(ucPath, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name !== '_index.md')
        .map((e) => path.join(ucPath, e.name));

      for (const topicFile of topicFiles) {
        await syncTopic(topicFile);
      }
    }
  }

  console.log('\n✅  Sync complete.');
}

main().catch((err) => {
  console.error('❌  Sync failed:', err.message || err);
  process.exit(1);
});
