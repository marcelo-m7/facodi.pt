/**
 * FACODI Topic Page Controller
 *
 * Applies topic data to the topic page DOM.
 *
 * @module facodi/ui/topicPage
 */

import { escapeHtml } from '../core/utils.js';
import { FALLBACK_TRANSLATIONS, createPageTranslator } from '../core/i18n.js';
import { renderTags, renderPlaylists } from './renderers.js';

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
 * Apply topic data to the topic page DOM.
 *
 * @param {string} _topicSlug - Reserved for future use (e.g. analytics)
 * @param {import('../services/topicService.js').TopicData} data
 */
export function applyTopicPage(_topicSlug, data) {
  if (!data) return;

  const t = createPageTranslator();

  if (data.summary) {
    setText('[data-facodi-topic-summary]', data.summary);
  }

  const tagsContainer = document.querySelector('[data-facodi-slot="topic-tags"]');
  if (tagsContainer && Array.isArray(data.tags)) {
    tagsContainer.innerHTML = data.tags.length
      ? renderTags(data.tags)
      : `<span class="text-muted small">${escapeHtml(t('topic.noTags', FALLBACK_TRANSLATIONS['topic.noTags']))}</span>`;
  }

  if (Array.isArray(data.playlists)) {
    const heading = escapeHtml(
      t('topic.relatedPlaylists', FALLBACK_TRANSLATIONS['topic.relatedPlaylists']),
    );
    setHTML(
      '#topic-playlists',
      `<h2 class="h5">${heading}</h2>${renderPlaylists(data.playlists, { emptyKey: 'topic.noPlaylists' })}`,
    );
  }
}
