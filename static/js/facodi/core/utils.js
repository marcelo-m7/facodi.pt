/**
 * FACODI Core Utilities
 *
 * Pure helper functions with no side effects, no DOM access,
 * and no external dependencies.
 *
 * @module facodi/core/utils
 */

/**
 * Escape HTML special characters to prevent XSS.
 * Returns an empty string for null/undefined values.
 *
 * @param {*} value - Value to escape
 * @returns {string} HTML-safe string
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format a numeric count with a singular/plural label.
 *
 * @param {number} count - Item count
 * @param {string} singular - Singular label
 * @param {string} plural   - Plural label
 * @returns {string} e.g. "1 item" or "3 itens"
 */
export function formatCount(count, singular, plural) {
  const label = count === 1 ? singular : plural;
  return `${count} ${label}`.trim();
}

/**
 * Parse a JSON string safely.
 * Returns the fallback value on parse errors.
 *
 * @param {string} json     - JSON string to parse
 * @param {*}      fallback - Value returned on error (default: null)
 * @returns {*} Parsed value or fallback
 */
export function safeJsonParse(json, fallback = null) {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Sort an array of objects by a numeric key, ascending.
 * Objects missing the key are treated as 0.
 *
 * @template T
 * @param {T[]}    items - Array to sort (not mutated)
 * @param {string} key   - Property name used for sorting
 * @returns {T[]} New sorted array
 */
export function sortByKey(items, key) {
  return items.slice().sort((a, b) => (a[key] || 0) - (b[key] || 0));
}
