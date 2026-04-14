/**
 * FACODI Supabase Client
 *
 * This file is the designated entry point for Supabase integration.
 * It currently runs in "static" mode — all content is served from Hugo's
 * Markdown front matter and no external calls are made.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * HOW TO ENABLE SUPABASE (future step)
 * ──────────────────────────────────────────────────────────────────────────
 * 1. Add the Supabase JS CDN (or bundle) to your baseof.html <head>.
 * 2. Set SUPABASE_URL and SUPABASE_ANON_KEY as Hugo environment variables
 *    or inject them via a <script> tag with id="facodi-supabase-config".
 * 3. Replace the stub adapters below with real Supabase queries.
 * 4. Call `window.facodiApp.configureAdapters(supabaseAdapters)` once the
 *    client is ready — the service layer will switch automatically without
 *    any changes to page controllers or Hugo templates.
 *
 * Example adapter shape (matches facodi/services/*Service.js):
 *
 *   const supabaseCourseAdapter = {
 *     async getCourse(courseCode) {
 *       const { data, error } = await supabase
 *         .from('catalog.course')
 *         .select('*, ucs:catalog.uc(*)')
 *         .eq('code', courseCode)
 *         .single();
 *       if (error) throw error;
 *       return data;
 *     }
 *   };
 * ──────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  const logPrefix = '[FACODI]';

  // Read optional Supabase config embedded by Hugo or server-side rendering.
  let _config = null;
  const configEl = document.getElementById('facodi-supabase-config');
  if (configEl) {
    try {
      _config = JSON.parse(configEl.textContent || 'null');
    } catch {
      console.warn(`${logPrefix} Could not parse Supabase config.`);
    }
  }

  const isEnabled = Boolean(_config && _config.url && _config.anonKey);

  // Expose a minimal public object so page code can query the integration mode.
  window.facodiStatic = {
    initialized: true,
    version: '2.0.0-static',
    supabaseEnabled: isEnabled,
  };

  if (isEnabled) {
    console.info(`${logPrefix} Supabase config detected — integration ready.`);
  } else {
    console.info(`${logPrefix} Running in static mode (no Supabase config found).`);
  }
})();
