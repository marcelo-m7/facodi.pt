/**
 * FACODI UC Page Controller
 *
 * Applies UC data to the UC page DOM.
 *
 * @module facodi/ui/ucPage
 */

import { escapeHtml } from '../core/utils.js';
import { FALLBACK_TRANSLATIONS, createPageTranslator } from '../core/i18n.js';
import { renderOutcomes, renderPlaylists, renderUcTopics } from './renderers.js';

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
 * Apply UC data to the UC page DOM.
 *
 * @param {string} courseCode
 * @param {string} ucCode
 * @param {import('../services/ucService.js').UCData} data
 */
export function applyUCPage(courseCode, ucCode, data) {
  if (!data) return;

  const t = createPageTranslator();

  if (data.description || data.summary) {
    setText('[data-facodi-uc-summary]', data.description || data.summary || '');
  }

  if (Array.isArray(data.outcomes)) {
    const heading = escapeHtml(t('uc.learningOutcomes', FALLBACK_TRANSLATIONS['uc.learningOutcomes']));
    setHTML('#uc-learning-outcomes', `<h2 class="h5">${heading}</h2>${renderOutcomes(data.outcomes)}`);
  }

  if (Array.isArray(data.playlists)) {
    const heading = escapeHtml(t('uc.playlists', FALLBACK_TRANSLATIONS['uc.playlists']));
    setHTML(
      '#uc-playlists',
      `<h2 class="h5">${heading}</h2>${renderPlaylists(data.playlists, { emptyKey: 'uc.noPlaylists' })}`,
    );
  }

  if (Array.isArray(data.prerequisites) && data.prerequisites.length) {
    const el = document.querySelector('[data-facodi-uc-prerequisites]');
    if (el) {
      el.textContent = data.prerequisites.join(', ');
      el.classList.remove('text-muted');
      el.classList.add('notranslate');
    }
  }

  if (Array.isArray(data.topics)) {
    const container = document.getElementById('uc-topics');
    if (container) {
      const topicsHeading = escapeHtml(t('uc.topics', FALLBACK_TRANSLATIONS['uc.topics']));
      container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h2 class="h4 mb-0">${topicsHeading}</h2>
        </div>
        ${renderUcTopics(courseCode, ucCode, data.topics)}
      `;
    }
  }
}
