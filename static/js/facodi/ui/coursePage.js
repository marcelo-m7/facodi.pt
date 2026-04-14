/**
 * FACODI Course Page Controller
 *
 * Applies course data to the DOM.  Depends on the UI renderers for HTML
 * generation and on the course service for data access — the controller
 * itself never touches the network or embeds HTML strings.
 *
 * @module facodi/ui/coursePage
 */

import { escapeHtml, formatCount } from '../core/utils.js';
import { FALLBACK_TRANSLATIONS, createPageTranslator } from '../core/i18n.js';
import { renderCourseUcs } from './renderers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setText(selector, text) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (el) el.textContent = text;
}

function setHTML(selector, html) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (el) el.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply course data to the course page DOM.
 *
 * @param {string} courseCode
 * @param {import('../services/courseService.js').CourseData} data
 */
export function applyCoursePage(courseCode, data) {
  if (!data) return;

  const t = createPageTranslator();

  if (data.summary) {
    setText('[data-facodi-course-summary]', data.summary);
  }

  if (Array.isArray(data.ucs)) {
    const container = document.querySelector('[data-facodi-slot="course-ucs"]');
    if (container) {
      setHTML(container, renderCourseUcs(courseCode, data.ucs));
    }

    const countEl = document.getElementById('course-uc-count');
    if (countEl) {
      const singular = t('common.unit', FALLBACK_TRANSLATIONS['common.unit']);
      const plural = t('common.units', FALLBACK_TRANSLATIONS['common.units']);
      countEl.textContent = formatCount(data.ucs.length, singular, plural);
    }
  }
}
