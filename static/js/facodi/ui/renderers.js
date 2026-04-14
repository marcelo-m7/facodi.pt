/**
 * FACODI UI Renderers
 *
 * Pure functions that convert data objects into HTML strings.
 * No DOM access, no side effects — safe to unit-test in isolation.
 *
 * @module facodi/ui/renderers
 */

import { escapeHtml, formatCount, sortByKey } from '../core/utils.js';
import { FALLBACK_TRANSLATIONS, createTranslator } from '../core/i18n.js';

// ---------------------------------------------------------------------------
// Module-level translator (replaced via configure() when i18n is ready)
// ---------------------------------------------------------------------------

let _t = createTranslator();

/**
 * Update the translator used by all renderers.
 * Call this when the page i18n manager becomes available.
 *
 * @param {{ translate: (key: string) => string }} manager
 */
export function configure(manager) {
  _t = createTranslator({
    manager,
    translations: FALLBACK_TRANSLATIONS,
  });
}

// ---------------------------------------------------------------------------
// Tag renderer
// ---------------------------------------------------------------------------

/**
 * Render an array of tag strings as badge `<span>` elements.
 *
 * @param {string[]} tags
 * @returns {string} HTML fragment (empty string when tags is empty)
 */
export function renderTags(tags) {
  if (!tags || !tags.length) return '';
  return tags
    .map((tag) => `<span class="badge rounded-pill bg-light text-muted me-1">${escapeHtml(tag)}</span>`)
    .join('');
}

// ---------------------------------------------------------------------------
// Playlist renderer
// ---------------------------------------------------------------------------

/**
 * Render a list of YouTube playlists.
 *
 * @param {Array<{id?: string, playlist_id?: string, priority?: number}>} playlists
 * @param {Object}  [options={}]
 * @param {string}  [options.emptyKey='uc.noPlaylists'] i18n key for empty state
 * @returns {string} HTML fragment
 */
export function renderPlaylists(playlists, options = {}) {
  const emptyKey = options.emptyKey || 'uc.noPlaylists';
  const emptyText = _t(emptyKey, FALLBACK_TRANSLATIONS[emptyKey] || '');

  if (!playlists || !playlists.length) {
    return emptyText ? `<p class="text-muted small">${escapeHtml(emptyText)}</p>` : '';
  }

  const items = sortByKey(playlists, 'priority').map((playlist) => {
    const rawId = playlist.id || playlist.playlist_id || '';
    const id = rawId ? String(rawId) : '';
    const escapedId = escapeHtml(id);
    const label = id || _t('common.playlist', FALLBACK_TRANSLATIONS['common.playlist']);
    return `<li class="mb-2"><a class="d-inline-flex align-items-center" href="https://www.youtube.com/playlist?list=${escapedId}" target="_blank" rel="noopener"><span class="badge bg-danger me-2">YT</span>${escapeHtml(label)}</a></li>`;
  });

  return `<ul class="list-unstyled">${items.join('')}</ul>`;
}

// ---------------------------------------------------------------------------
// Learning outcomes renderer
// ---------------------------------------------------------------------------

/**
 * Render an ordered list of learning outcomes.
 *
 * @param {Array<string | {outcome: string, order?: number}>} outcomes
 * @returns {string} HTML fragment
 */
export function renderOutcomes(outcomes) {
  if (!outcomes || !outcomes.length) {
    const empty = _t('uc.noLearningOutcomes', FALLBACK_TRANSLATIONS['uc.noLearningOutcomes']);
    return `<p class="text-muted small">${escapeHtml(empty)}</p>`;
  }

  const items = sortByKey(outcomes, 'order')
    .map((item) => {
      const value = typeof item === 'string' ? item : item.outcome || '';
      return `<li class="mb-2 notranslate">${escapeHtml(value)}</li>`;
    })
    .join('');

  return `<ol class="ps-3 notranslate">${items}</ol>`;
}

// ---------------------------------------------------------------------------
// UC card renderer
// ---------------------------------------------------------------------------

/**
 * Render a single UC as a card element.
 *
 * @param {Object} uc         - UC data object
 * @param {string} courseCode - Parent course code (used to build URL)
 * @returns {string} HTML fragment
 */
export function renderUcCard(uc, courseCode) {
  const url =
    uc.path ||
    `/courses/${encodeURIComponent(courseCode.toLowerCase())}/uc/${encodeURIComponent(uc.code.toLowerCase())}/`;
  const description = uc.description || uc.summary || '';
  const ects = typeof uc.ects === 'number' ? uc.ects : uc.ects || '--';
  const language = uc.language || '--';
  const semester = uc.semester || uc.semesterGlobal;
  const semesterLabel = escapeHtml(_t('common.semester', FALLBACK_TRANSLATIONS['common.semester']));
  const ectsLabel = escapeHtml(_t('common.ects', FALLBACK_TRANSLATIONS['common.ects']));
  const languageLabel = escapeHtml(_t('common.language', FALLBACK_TRANSLATIONS['common.language']));

  return `
    <article class="course-uc-card">
      <div class="course-uc-card__meta">
        <span class="course-uc-card__code">${escapeHtml(uc.code || '')}</span>
        ${semester ? `<span class="course-uc-card__semester">${semesterLabel} ${escapeHtml(String(semester))}</span>` : ''}
      </div>
      <h3 class="course-uc-card__title notranslate">
        <a class="course-uc-card__link" href="${escapeHtml(url)}">${escapeHtml(uc.name || uc.title || '')}</a>
      </h3>
      ${description ? `<p class="course-uc-card__summary notranslate">${escapeHtml(description)}</p>` : ''}
      <dl class="course-uc-card__details">
        <dt>${ectsLabel}</dt>
        <dd>${escapeHtml(String(ects))}</dd>
        <dt>${languageLabel}</dt>
        <dd>${escapeHtml(language)}</dd>
      </dl>
    </article>
  `;
}

// ---------------------------------------------------------------------------
// Course UCs grid renderer
// ---------------------------------------------------------------------------

/**
 * Render all UCs of a course, grouped by year and semester.
 *
 * @param {string}   courseCode
 * @param {Object[]} ucs
 * @returns {string} HTML fragment
 */
export function renderCourseUcs(courseCode, ucs) {
  if (!ucs || !ucs.length) {
    const empty = _t('course.noUcs', FALLBACK_TRANSLATIONS['course.noUcs']);
    return `<div class="alert alert-warning" role="alert">${escapeHtml(empty)}</div>`;
  }

  const yearLabel = escapeHtml(_t('common.year', FALLBACK_TRANSLATIONS['common.year']));
  const semesterLabel = escapeHtml(_t('common.semester', FALLBACK_TRANSLATIONS['common.semester']));

  const grouped = new Map();
  const yearOrder = [];

  ucs.forEach((uc) => {
    const year = uc.year || 1;
    const semester = uc.semester || 1;

    if (!grouped.has(year)) {
      grouped.set(year, new Map());
      yearOrder.push(year);
    }

    const semMap = grouped.get(year);
    if (!semMap.has(semester)) semMap.set(semester, []);
    semMap.get(semester).push(uc);
  });

  yearOrder.sort((a, b) => a - b);

  return yearOrder
    .map((year) => {
      const semMap = grouped.get(year);
      const semesterSections = [1, 2]
        .map((sem) => {
          const list = semMap.get(sem);
          if (!list || !list.length) return '';

          const globalSemester = (year - 1) * 2 + sem;
          const cards = list
            .slice()
            .sort((a, b) => (a.code || '').localeCompare(b.code || ''))
            .map((uc) => renderUcCard(uc, courseCode))
            .join('');

          return `
            <div class="course-uc-semester">
              <h4 class="course-uc-semester__title">${semesterLabel} ${escapeHtml(String(globalSemester))}</h4>
              <div class="course-uc-grid">${cards}</div>
            </div>
          `;
        })
        .filter(Boolean)
        .join('');

      return `
        <section class="course-uc-year">
          <header class="course-uc-year__header">
            <h3 class="course-uc-year__title">${yearLabel} ${escapeHtml(String(year))}</h3>
          </header>
          ${semesterSections}
        </section>
      `;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// UC topics list renderer
// ---------------------------------------------------------------------------

/**
 * Render a list of topics associated with a UC.
 *
 * @param {string}   courseCode
 * @param {string}   ucCode
 * @param {Object[]} topics
 * @returns {string} HTML fragment
 */
export function renderUcTopics(courseCode, ucCode, topics) {
  if (!topics || !topics.length) {
    const empty = _t('uc.noTopics', FALLBACK_TRANSLATIONS['uc.noTopics']);
    return `<div class="alert alert-info" role="alert">${escapeHtml(empty)}</div>`;
  }

  return `
    <div class="list-group list-group-flush">
      ${topics
        .slice()
        .sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''))
        .map((topic) => {
          const slug = topic.slug || '';
          const url =
            topic.path ||
            `/courses/${encodeURIComponent(courseCode.toLowerCase())}/uc/${encodeURIComponent(ucCode.toLowerCase())}/${encodeURIComponent(slug)}/`;
          const summary = topic.summary || '';
          const playlistCount = Array.isArray(topic.playlists) ? topic.playlists.length : 0;
          const playlistLabel =
            playlistCount === 1
              ? _t('common.playlist', FALLBACK_TRANSLATIONS['common.playlist'])
              : _t('common.playlists', FALLBACK_TRANSLATIONS['common.playlists']);
          const playlistBadge = playlistCount
            ? `<span class="badge bg-primary-subtle text-primary">${escapeHtml(`${playlistCount} ${playlistLabel}`)}</span>`
            : '';
          const tagsHtml = renderTags(topic.tags || []);

          return `
            <a class="list-group-item list-group-item-action" href="${escapeHtml(url)}">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h3 class="h6 mb-1 notranslate">${escapeHtml(topic.name || topic.title || slug)}</h3>
                  ${summary ? `<p class="mb-1 small text-muted notranslate">${escapeHtml(summary)}</p>` : ''}
                </div>
                ${playlistBadge}
              </div>
              ${tagsHtml ? `<div class="mt-2">${tagsHtml}</div>` : ''}
            </a>
          `;
        })
        .join('')}
    </div>
  `;
}
