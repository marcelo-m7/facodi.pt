/**
 * FACODI Course Service
 *
 * Responsible for reading course data and feeding the course page controller.
 *
 * Current strategy: reads structured JSON embedded by Hugo inside a
 * `<script id="facodi-course-data" type="application/json">` tag.
 *
 * Future strategy: swap the adapter for a Supabase client call without
 * touching the controller or UI layer.
 *
 * @module facodi/services/courseService
 */

import { safeJsonParse } from '../core/utils.js';

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} CourseAdapter
 * @property {(courseCode: string) => Promise<CourseData|null>} getCourse
 */

/**
 * @typedef {Object} CourseData
 * @property {string}   code
 * @property {string}   [name]
 * @property {string}   [summary]
 * @property {string}   [plan_version]
 * @property {number}   [ects_total]
 * @property {Object[]} [ucs]
 */

// ---------------------------------------------------------------------------
// Built-in DOM adapter (default, no external dependencies)
// ---------------------------------------------------------------------------

/**
 * Read course data embedded in the page by Hugo.
 *
 * @returns {CourseData|null}
 */
function readFromDOM() {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('facodi-course-data');
  if (!el) return null;
  return safeJsonParse(el.textContent, null);
}

/** @type {CourseAdapter} */
const domAdapter = {
  getCourse(_courseCode) {
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
 * Replace the data adapter.
 * Call this once during application bootstrap to switch to Supabase
 * (or any other back-end) without modifying page controllers.
 *
 * @param {CourseAdapter} adapter
 */
export function configureAdapter(adapter) {
  _adapter = adapter;
}

/**
 * Retrieve course data for the given course code.
 *
 * @param {string} courseCode
 * @returns {Promise<CourseData|null>}
 */
export function getCourse(courseCode) {
  return _adapter.getCourse(courseCode);
}

/**
 * High-level helper: load and return all course page data.
 * Controllers should call this instead of `getCourse` directly.
 *
 * @param {string} courseCode
 * @param {string} [_planVersion] - Reserved for future API filtering
 * @returns {Promise<CourseData|null>}
 */
export function loadCoursePage(courseCode, _planVersion) {
  return getCourse(courseCode);
}
