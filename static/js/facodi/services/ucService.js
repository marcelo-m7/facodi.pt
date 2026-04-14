/**
 * FACODI UC Service
 *
 * Responsible for reading Curricular Unit (UC) data and feeding the UC page
 * controller.
 *
 * Default strategy: reads JSON embedded by Hugo inside
 * `<script id="facodi-uc-data" type="application/json">`.
 *
 * Future strategy: swap the adapter for a Supabase client call.
 *
 * @module facodi/services/ucService
 */

import { safeJsonParse } from '../core/utils.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} UCAdapter
 * @property {(ucCode: string) => Promise<UCData|null>} getUC
 */

/**
 * @typedef {Object} UCData
 * @property {string}   code
 * @property {string}   [name]
 * @property {string}   [description]
 * @property {string}   [summary]
 * @property {number}   [ects]
 * @property {number}   [semester]
 * @property {string}   [language]
 * @property {string[]} [prerequisites]
 * @property {Array<string|{outcome:string,order?:number}>} [outcomes]
 * @property {Array<{id?:string,playlist_id?:string,priority?:number}>} [playlists]
 * @property {Object[]} [topics]
 */

// ---------------------------------------------------------------------------
// Built-in DOM adapter
// ---------------------------------------------------------------------------

function readFromDOM() {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('facodi-uc-data');
  if (!el) return null;
  return safeJsonParse(el.textContent, null);
}

/** @type {UCAdapter} */
const domAdapter = {
  getUC(_ucCode) {
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
 * @param {UCAdapter} adapter
 */
export function configureAdapter(adapter) {
  _adapter = adapter;
}

/**
 * Retrieve UC data for the given UC code.
 *
 * @param {string} ucCode
 * @returns {Promise<UCData|null>}
 */
export function getUC(ucCode) {
  return _adapter.getUC(ucCode);
}

/**
 * High-level helper: load and return all UC page data.
 *
 * @param {string} ucCode
 * @returns {Promise<UCData|null>}
 */
export function loadUCPage(ucCode) {
  return getUC(ucCode);
}
