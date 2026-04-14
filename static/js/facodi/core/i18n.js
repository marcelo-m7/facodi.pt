/**
 * FACODI i18n Core
 *
 * Lightweight translation helper.  Resolves keys through a priority chain:
 *   1. External i18n manager (window.facodiI18n) — set at runtime
 *   2. Page-embedded translations (JSON in <script id="facodi-translations">)
 *   3. Caller-supplied fallback string
 *   4. Built-in FALLBACK_TRANSLATIONS
 *   5. Empty string
 *
 * All functions that touch the DOM are guarded so this module is safe
 * to import in test environments (jsdom / Node).
 *
 * @module facodi/core/i18n
 */

/** @type {Object<string, string>} */
export const FALLBACK_TRANSLATIONS = {
  'course.noUcs':
    'Ainda não adicionamos unidades curriculares por aqui. Bora sugerir playlists e conteúdos para abrir essa trilha?',
  'common.unit': 'unidade',
  'common.units': 'unidades',
  'common.semester': 'Semestre',
  'common.year': 'Ano',
  'common.playlist': 'playlist',
  'common.playlists': 'playlists',
  'common.topic': 'tópico',
  'common.topics': 'tópicos',
  'common.ects': 'ECTS',
  'common.language': 'Idioma',
  'uc.topics': 'Tópicos',
  'uc.noTopics':
    'Ainda não temos tópicos conectados. Indica teus conteúdos favoritos para turbinar esta UC!',
  'uc.playlists': 'Playlists',
  'uc.noPlaylists':
    'Nenhuma playlist cadastrada por enquanto. Que tal sugerir uma nos canais da FACODI?',
  'uc.learningOutcomes': 'Resultados de Aprendizagem',
  'uc.noLearningOutcomes':
    'Ainda estamos construindo os resultados de aprendizagem desta UC com a comunidade.',
  'uc.noPrerequisites': 'Nenhum pré-requisito informado ainda.',
  'topic.noTags':
    'Nenhuma tag adicionada ainda. Fala tu, mona, e ajuda a indexar esse conteúdo!',
  'topic.relatedPlaylists': 'Playlists relacionadas',
  'topic.noPlaylists':
    'Sem playlists cadastradas por enquanto. Compartilha tua seleção nos canais da FACODI!',
};

/**
 * Read the page-embedded translation dictionary from
 * `<script id="facodi-translations" type="application/json">`.
 *
 * @returns {Object<string, string>}
 */
export function getTranslations() {
  if (typeof document === 'undefined') return {};
  const script = document.getElementById('facodi-translations');
  if (!script) return {};
  try {
    return JSON.parse(script.textContent || '{}') || {};
  } catch {
    return {};
  }
}

/**
 * Create a translate function bound to a specific context.
 *
 * @param {Object} [options={}]
 * @param {Object<string, string>} [options.translations={}]
 *   Page-embedded translations (usually from `getTranslations()`).
 * @param {{ translate: (key: string) => string }} [options.manager=null]
 *   External i18n manager (e.g. `window.facodiI18n`).
 * @returns {(key: string, fallback?: string) => string} Translate function
 */
export function createTranslator({ translations = {}, manager = null } = {}) {
  return function t(key, fallback) {
    if (!key) return typeof fallback === 'string' ? fallback : '';

    if (manager && typeof manager.translate === 'function') {
      const v = manager.translate(key);
      if (v) return v;
    }

    if (Object.prototype.hasOwnProperty.call(translations, key)) {
      return translations[key];
    }

    if (fallback !== undefined) return fallback;

    if (Object.prototype.hasOwnProperty.call(FALLBACK_TRANSLATIONS, key)) {
      return FALLBACK_TRANSLATIONS[key];
    }

    return '';
  };
}

/**
 * Convenience: create a translator wired up to the current page context
 * (embedded JSON + `window.facodiI18n` if available).
 *
 * @returns {(key: string, fallback?: string) => string}
 */
export function createPageTranslator() {
  return createTranslator({
    translations: getTranslations(),
    manager: typeof window !== 'undefined' ? window.facodiI18n || null : null,
  });
}
