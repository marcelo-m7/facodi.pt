/**
 * FACODI Application Entry Point
 *
 * Bootstraps the application by:
 *  1. Detecting the current page type from `<body>` data-attributes set by Hugo.
 *  2. Loading the relevant data via the service layer.
 *  3. Delegating DOM updates to the appropriate page controller.
 *
 * Route map (mirrors Hugo content hierarchy):
 *   /courses/                   → course list  (static, no JS needed)
 *   /courses/:code/             → course page   (data-course)
 *   /courses/:code/uc/:uc/      → UC page       (data-course + data-uc)
 *   /courses/:code/uc/:uc/:topic → topic page   (data-topic)
 *
 * To plug in Supabase (or any other back-end) without modifying this file:
 *
 *   import { configureAdapter } from './services/courseService.js';
 *   configureAdapter(mySupabaseAdapter);
 *
 * @module facodi/app
 */

import { loadCoursePage } from './services/courseService.js';
import { loadUCPage } from './services/ucService.js';
import { loadTopicPage } from './services/topicService.js';
import { applyCoursePage } from './ui/coursePage.js';
import { applyUCPage } from './ui/ucPage.js';
import { applyTopicPage } from './ui/topicPage.js';
import { configure as configureRenderers } from './ui/renderers.js';

const LOG_PREFIX = '[FACODI]';

// ---------------------------------------------------------------------------
// i18n wiring
// ---------------------------------------------------------------------------

function wireI18n() {
  const handleManager = (manager) => configureRenderers(manager);

  document.addEventListener('facodi:i18n-ready', (e) => {
    if (e.detail && e.detail.manager) handleManager(e.detail.manager);
    init();
  });

  document.addEventListener('facodi:i18n-change', (e) => {
    if (e.detail && e.detail.manager) handleManager(e.detail.manager);
    init();
  });

  if (typeof window !== 'undefined' && window.facodiI18n) {
    handleManager(window.facodiI18n);
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

async function route(body) {
  const { course: courseCode, uc: ucCode, topic: topicSlug } = body.dataset;

  if (topicSlug) {
    const data = await loadTopicPage(topicSlug);
    applyTopicPage(topicSlug, data);
    return;
  }

  if (ucCode) {
    const data = await loadUCPage(ucCode);
    applyUCPage(courseCode || '', ucCode, data);
    return;
  }

  if (courseCode) {
    const data = await loadCoursePage(courseCode);
    applyCoursePage(courseCode, data);
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init() {
  const body = document.body;
  if (!body || !body.dataset) return;

  try {
    await route(body);
  } catch (err) {
    console.error(`${LOG_PREFIX} Page initialisation failed.`, err);
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  wireI18n();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Export for testing / external use
export { init, route };
