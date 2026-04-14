/**
 * FACODI Topic Service
 *
 * Responsible for reading topic data and feeding the topic page controller.
 *
 * Default strategy: reads JSON embedded by Hugo inside
 * `<script id="facodi-topic-data" type="application/json">`.
 *
 * Future strategy: swap the adapter for a Supabase client call.
 *
 * @module facodi/services/topicService
 */

import { safeJsonParse } from '../core/utils.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} TopicAdapter
 * @property {(topicSlug: string) => Promise<TopicData|null>} getTopic
 */

/**
 * @typedef {Object} TopicData
 * @property {string}   slug
 * @property {string}   [name]
 * @property {string}   [summary]
 * @property {string[]} [tags]
 * @property {Array<{id?:string,playlist_id?:string,priority?:number}>} [playlists]
 */

// ---------------------------------------------------------------------------
// Built-in DOM adapter
// ---------------------------------------------------------------------------

function readFromDOM() {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('facodi-topic-data');
  if (!el) return null;
  return safeJsonParse(el.textContent, null);
}

/** @type {TopicAdapter} */
const domAdapter = {
  getTopic(_topicSlug) {
    return Promise.resolve(readFromDOM());
  },
};

// ---------------------------------------------------------------------------
// Service state
// ---------------------------------------------------------------------------

let _adapter = domAdapter;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Replace the data adapter (e.g. with a Supabase client adapter).
 *
 * @param {TopicAdapter} adapter
 */
export function configureAdapter(adapter) {
  _adapter = adapter;
}

/**
 * Retrieve topic data for the given slug.
 *
 * @param {string} topicSlug
 * @returns {Promise<TopicData|null>}
 */
export function getTopic(topicSlug) {
  return _adapter.getTopic(topicSlug);
}

/**
 * High-level helper: load and return all topic page data.
 *
 * @param {string} topicSlug
 * @returns {Promise<TopicData|null>}
 */
export function loadTopicPage(topicSlug) {
  return getTopic(topicSlug);
}
