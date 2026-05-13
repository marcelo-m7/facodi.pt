#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const toml = require('toml');

const CONTENT_DIR = path.resolve(process.cwd(), 'content');
const LANG_CONFIG_PATH = path.resolve(process.cwd(), 'config', '_default', 'languages.toml');
const errors = [];

function loadLanguageDirs() {
  try {
    const raw = fs.readFileSync(LANG_CONFIG_PATH, 'utf8');
    const parsed = toml.parse(raw);
    const entries = Object.entries(parsed || {});
    if (entries.length === 0) {
      return [{ code: 'default', absDir: CONTENT_DIR }];
    }
    return entries.map(([code, config]) => {
      const relDir = config && config.contentDir ? config.contentDir : 'content';
      return { code, absDir: path.resolve(process.cwd(), relDir) };
    });
  } catch (err) {
    console.warn(`[FACODI] Não foi possível ler ${LANG_CONFIG_PATH}: ${err.message}`);
    return [{ code: 'default', absDir: CONTENT_DIR }];
  }
}

function walk(dir, lang, baseDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, lang, baseDir);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      validateFile(fullPath, lang, baseDir);
    }
  }
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function expectFields(data, required, filePath) {
  required.forEach((field) => {
    if (data[field] === undefined) {
      errors.push(`${filePath}: campo obrigatório "${field}" ausente.`);
    }
  });
}

function isString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateCourse(relPath, data, filePath) {
  expectFields(
    data,
    [
      'code',
      'title',
      'degree',
      'ects_total',
      'duration_semesters',
      'plan_version',
      'institution',
      'school',
      'language',
      'summary',
    ],
    filePath,
  );

  if (data.type && data.type !== 'course') {
    errors.push(`${filePath}: valor "type" deve ser "course".`);
  }

  if (data.ects_total !== undefined && Number.isNaN(Number(data.ects_total))) {
    errors.push(`${filePath}: "ects_total" deve ser numérico.`);
  }
  if (data.duration_semesters !== undefined && Number.isNaN(Number(data.duration_semesters))) {
    errors.push(`${filePath}: "duration_semesters" deve ser numérico.`);
  }
}

function validateUC(relPath, data, filePath) {
  expectFields(
    data,
    [
      'code',
      'title',
      'description',
      'ects',
      'semester',
      'language',
      'prerequisites',
      'learning_outcomes',
      'youtube_playlists',
      'topics',
    ],
    filePath,
  );

  if (data.type && data.type !== 'uc') {
    errors.push(`${filePath}: valor "type" deve ser "uc".`);
  }

  if (!Array.isArray(data.prerequisites)) {
    errors.push(`${filePath}: "prerequisites" deve ser uma lista.`);
  }
  if (!Array.isArray(data.learning_outcomes)) {
    errors.push(`${filePath}: "learning_outcomes" deve ser uma lista.`);
  }
  if (!Array.isArray(data.youtube_playlists)) {
    errors.push(`${filePath}: "youtube_playlists" deve ser uma lista.`);
  } else {
    data.youtube_playlists.forEach((item, index) => {
      if (!item || !isString(item.id)) {
        errors.push(`${filePath}: playlist #${index + 1} deve possuir "id".`);
      }
    });
  }
  if (!Array.isArray(data.topics)) {
    errors.push(`${filePath}: "topics" deve ser uma lista.`);
  } else {
    data.topics.forEach((topic, index) => {
      const slug = typeof topic === 'string' ? topic : topic && topic.slug;
      if (!isString(slug)) {
        errors.push(`${filePath}: tópico #${index + 1} precisa de um "slug" válido.`);
      }
    });
  }
}

function validateTopic(relPath, data, filePath, fileName) {
  expectFields(data, ['slug', 'title', 'summary', 'youtube_playlists', 'tags'], filePath);

  if (data.type && data.type !== 'topic') {
    errors.push(`${filePath}: valor "type" deve ser "topic".`);
  }

  if (!Array.isArray(data.youtube_playlists)) {
    errors.push(`${filePath}: "youtube_playlists" deve ser uma lista.`);
  }
  if (!Array.isArray(data.tags)) {
    errors.push(`${filePath}: "tags" deve ser uma lista.`);
  }

  const expectedSlug = fileName.replace(/\.md$/, '');
  if (data.slug && data.slug !== expectedSlug) {
    errors.push(`${filePath}: slug "${data.slug}" difere do nome do ficheiro "${expectedSlug}".`);
  }
}

function validateFile(fullPath, lang, baseDir) {
  const relPath = toPosix(path.relative(baseDir, fullPath));
  const filePath = toPosix(path.relative(process.cwd(), fullPath));

  const raw = fs.readFileSync(fullPath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data || {};

  if (/^courses\/[^/]+\/[^/]+\/index\.md$/i.test(relPath)) {
    validateCourse(relPath, data, filePath);
  } else if (/^courses\/[^/]+\/[^/]+\/uc\/[^/]+\/index\.md$/i.test(relPath)) {
    validateUC(relPath, data, filePath);
  } else if (/^courses\/[^/]+\/[^/]+\/uc\/[^/]+\/[^/]+\.md$/i.test(relPath)) {
    const fileName = path.basename(relPath);
    if (fileName.toLowerCase() !== 'index.md') {
      validateTopic(relPath, data, filePath, fileName);
    }
  }
}

const languages = loadLanguageDirs();
languages.forEach((lang) => {
  try {
    if (!fs.existsSync(lang.absDir)) {
      console.warn(`[FACODI] Diretório de conteúdo ausente para ${lang.code}: ${lang.absDir}`);
      return;
    }
    walk(lang.absDir, lang.code, lang.absDir);
  } catch (err) {
    console.warn(`[FACODI] Não foi possível processar ${lang.absDir}: ${err.message}`);
  }
});

if (errors.length > 0) {
  console.error('❌ Erros de frontmatter encontrados:');
  errors.forEach((msg) => console.error(` - ${msg}`));
  process.exit(1);
}

console.log('✅ Frontmatter válido para todos os conteúdos.');
