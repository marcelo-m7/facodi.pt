/**
 * FACODI Supabase Client
 *
 * Initialises the Supabase JS v2 client using credentials embedded by Hugo
 * at build time inside the `facodi-config` JSON script tag.
 *
 * The resulting client is exposed as `window.facodiSupabase` so that
 * `loaders.js` and other scripts can use it without tight coupling.
 *
 * Prerequisites (handled by layouts/_partials/footer/script-footer-custom.html):
 *   1. The Supabase UMD bundle must be loaded from CDN before this script runs,
 *      making `window.supabase.createClient` available globally.
 *   2. A `<script id="facodi-config" type="application/json">` tag must contain
 *      `{ "supabaseUrl": "...", "supabaseAnonKey": "..." }`.
 */
(function () {
  'use strict';

  const logPrefix = '[FACODI]';

  /**
   * Read the build-time config injected by Hugo into the page.
   * @returns {{ supabaseUrl?: string, supabaseAnonKey?: string }}
   */
  const getConfig = () => {
    const script = document.getElementById('facodi-config');
    if (!script) return {};
    try {
      return JSON.parse(script.textContent || '{}') || {};
    } catch (e) {
      console.warn(`${logPrefix} Could not parse facodi-config.`, e);
      return {};
    }
  };

  /**
   * Create and expose the Supabase client.
   * Silently degrades if the library is missing or credentials are absent.
   */
  const initClient = () => {
    const config = getConfig();
    const url = config.supabaseUrl;
    const key = config.supabaseAnonKey;

    if (!url || !key) {
      console.warn(`${logPrefix} Supabase credentials not configured; dynamic loading disabled.`);
      window.facodiSupabase = null;
      return;
    }

    if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
      console.warn(`${logPrefix} Supabase JS library not available; dynamic loading disabled.`);
      window.facodiSupabase = null;
      return;
    }

    try {
      window.facodiSupabase = window.supabase.createClient(url, key);
      console.info(`${logPrefix} Supabase client initialised.`);
    } catch (e) {
      console.error(`${logPrefix} Failed to initialise Supabase client.`, e);
      window.facodiSupabase = null;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClient);
  } else {
    initClient();
  }
})();
