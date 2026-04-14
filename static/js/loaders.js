/**
 * FACODI Static Content Loaders
 * 
 * Handles rendering and updating static page content from Hugo front matter.
 * All data is embedded in the DOM as data attributes - no external API calls.
 * 
 * @module facodiLoaders
 */

(function () {
  'use strict';

  const logPrefix = '[FACODI]';

  /**
   * Fallback translations for UI text when i18n manager unavailable
   * @type {Object<string, string>}
   */
  const FALLBACK_TRANSLATIONS = {
    'course.noUcs': 'Ainda não adicionamos unidades curriculares por aqui. Bora sugerir playlists e conteúdos para abrir essa trilha?',
    'common.unit': 'unidade',
    'common.units': 'unidades',
    'common.semester': 'Semestre',
    'common.year': 'Ano',
    'common.playlist': 'playlist',
    'common.playlists': 'playlists',
    'common.topic': 'tópico',
    'common.topics': 'tópicos',
    'common.ects': 'ECTS',
    'common.language': 'Idioma',
    'uc.topics': 'Tópicos',
    'uc.noTopics': 'Ainda não temos tópicos conectados. Indica teus conteúdos favoritos para turbinar esta UC!',
    'uc.playlists': 'Playlists',
    'uc.noPlaylists': 'Nenhuma playlist cadastrada por enquanto. Que tal sugerir uma nos canais da FACODI?',
    'uc.learningOutcomes': 'Resultados de Aprendizagem',
    'uc.noLearningOutcomes': 'Ainda estamos construindo os resultados de aprendizagem desta UC com a comunidade.',
    'uc.noPrerequisites': 'Nenhum pré-requisito informado ainda.',
    'topic.noTags': 'Nenhuma tag adicionada ainda. Fala tu, mona, e ajuda a indexar esse conteúdo!',
    'topic.relatedPlaylists': 'Playlists relacionadas',
    'topic.noPlaylists': 'Sem playlists cadastradas por enquanto. Compartilha tua seleção nos canais da FACODI!'
  };

  // ============================================================================
  // Translation & Localization
  // ============================================================================

  /**
   * Get embedded translations from page script tag
   * @returns {Object<string, string>} Parsed translations object
   */
  const getTranslations = () => {
    const script = document.getElementById('facodi-translations');
    if (!script) return {};
    try {
      return JSON.parse(script.textContent || '{}') || {};
    } catch (error) {
      console.warn(`${logPrefix} Failed to parse embedded translations.`, error);
      return {};
    }
  };

  let translations = getTranslations();
  let i18nManager = typeof window !== 'undefined' ? window.facodiI18n || null : null;

  /**
   * Translate a key, with fallback chain:
   * 1. i18n manager (if initialized)
   * 2. Embedded translations (from page)
   * 3. Provided fallback parameter
   * 4. FALLBACK_TRANSLATIONS
   * 5. Empty string
   * 
   * @param {string} key - Translation key
   * @param {string} [fallback] - Optional fallback value
   * @returns {string} Translated text or fallback
   */
  const t = (key, fallback) => {
    if (!key) return typeof fallback === 'string' ? fallback : '';
    
    if (i18nManager && typeof i18nManager.translate === 'function') {
      const translated = i18nManager.translate(key);
      if (translated) return translated;
    }
    
    if (Object.prototype.hasOwnProperty.call(translations, key)) {
      return translations[key];
    }
    
    if (fallback !== undefined) return fallback;
    
    if (Object.prototype.hasOwnProperty.call(FALLBACK_TRANSLATIONS, key)) {
      return FALLBACK_TRANSLATIONS[key];
    }
    
    return '';
  };

  // ============================================================================
  // HTML & Text Utilities
  // ============================================================================

  /**
   * Escape HTML special characters to prevent XSS
   * @param {*} value - Value to escape
   * @returns {string} Escaped HTML-safe string
   */
  const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  /**
   * Format a count with singular/plural translation
   * @param {number} count - Item count
   * @param {string} singularKey - i18n key for singular form
   * @param {string} pluralKey - i18n key for plural form
   * @returns {string} Formatted count string (e.g., "3 tópicos")
   */
  const formatCount = (count, singularKey, pluralKey) => {
    const singular = t(singularKey, FALLBACK_TRANSLATIONS[singularKey] || singularKey);
    const plural = t(pluralKey, FALLBACK_TRANSLATIONS[pluralKey] || pluralKey);
    const label = count === 1 ? singular : plural;
    return `${count} ${label}`.trim();
  };

  /**
   * Format count with HTML escaping
   * @param {number} count - Item count
   * @param {string} singularKey - Singular i18n key
   * @param {string} pluralKey - Plural i18n key
   * @returns {string} HTML-escaped formatted count
   */
  const formatCountHtml = (count, singularKey, pluralKey) => 
    escapeHtml(formatCount(count, singularKey, pluralKey));

  /**
   * Update element innerHTML safely
   * @param {string|Element} selector - CSS selector or element
   * @param {string} html - HTML content to set
   */
  const updateHTML = (selector, html) => {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!element) return;
    element.innerHTML = html;
  };

  /**
   * Update element textContent safely
   * @param {string|Element} selector - CSS selector or element
   * @param {string} text - Text content to set
   */
  const updateText = (selector, text) => {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!element) return;
    element.textContent = text;
  };

  // ============================================================================
  // Rendering Functions
  // ============================================================================

  /**
   * Render markdown content using marked.js if available, otherwise fallback to <br>
   * @param {string} content - Markdown content
   * @returns {string} HTML-rendered content
   */
  const renderMarkdown = (content) => {
    if (!content) return '';
    if (typeof window !== 'undefined' && window.marked && typeof window.marked.parse === 'function') {
      return window.marked.parse(content);
    }
    return content.replace(/\n/g, '<br>');
  };

  /**
   * Render tags as badge elements
   * @param {string[]} tags - Array of tag strings
   * @returns {string} HTML badge elements
   */
  const renderTags = (tags) => {
    if (!tags || !tags.length) return '';
    return tags.map((tag) => 
      `<span class="badge rounded-pill bg-light text-muted me-1">${escapeHtml(tag)}</span>`
    ).join('');
  };

  /**
   * Render playlists as YouTube links
   * @param {Array<{id?: string, playlist_id?: string, priority?: number}>} playlists - Playlist objects
   * @param {Object} [options={}] - Render options
   * @param {string} [options.emptyKey='uc.noPlaylists'] - i18n key for empty message
   * @returns {string} HTML playlist list
   */
  const renderPlaylists = (playlists, options = {}) => {
    const emptyKey = options.emptyKey || 'uc.noPlaylists';
    const emptyText = t(emptyKey, FALLBACK_TRANSLATIONS[emptyKey] || '');
    
    if (!playlists || !playlists.length) {
      return emptyText ? `<p class="text-muted small">${escapeHtml(emptyText)}</p>` : '';
    }
    
    const items = playlists
      .slice()
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
      .map((playlist) => {
        const rawId = playlist.id || playlist.playlist_id || '';
        const id = rawId ? String(rawId) : '';
        const escapedId = escapeHtml(id);
        const label = id || t('common.playlist', FALLBACK_TRANSLATIONS['common.playlist']);
        return `<li class="mb-2"><a class="d-inline-flex align-items-center" href="https://www.youtube.com/playlist?list=${escapedId}" target="_blank" rel="noopener"><span class="badge bg-danger me-2">YT</span>${escapeHtml(label)}</a></li>`;
      });
    
    return `<ul class="list-unstyled">${items.join('')}</ul>`;
  };

  /**
   * Render learning outcomes as ordered list
   * @param {Array<string|{outcome: string, order?: number}>} outcomes - Outcomes array
   * @returns {string} HTML ordered list
   */
  const renderOutcomes = (outcomes) => {
    if (!outcomes || !outcomes.length) {
      const empty = t('uc.noLearningOutcomes', FALLBACK_TRANSLATIONS['uc.noLearningOutcomes']);
      return `<p class="text-muted small">${escapeHtml(empty)}</p>`;
    }
    
    const items = outcomes
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((item) => {
        const value = typeof item === 'string' ? item : item.outcome || '';
        return `<li class="mb-2 notranslate">${escapeHtml(value)}</li>`;
      })
      .join('');
    
    return `<ol class="ps-3 notranslate">${items}</ol>`;
  };

  /**
   * Render UC card for course listing
   * @private
   * @param {Object} uc - UC object with code, name, description, etc.
   * @param {string} courseCode - Parent course code
   * @returns {string} HTML card element
   */
  const renderUcCard = (uc, courseCode) => {
    const url = uc.path || `/courses/${encodeURIComponent(courseCode.toLowerCase())}/uc/${encodeURIComponent(uc.code.toLowerCase())}/`;
    const description = uc.description || uc.summary || '';
    const ects = typeof uc.ects === 'number' ? uc.ects : uc.ects || '--';
    const language = uc.language || '--';
    const semester = uc.semester || uc.semesterGlobal;
    const semesterLabel = escapeHtml(t('common.semester', FALLBACK_TRANSLATIONS['common.semester']));
    const ectsLabel = escapeHtml(t('common.ects', FALLBACK_TRANSLATIONS['common.ects']));
    const languageLabel = escapeHtml(t('common.language', FALLBACK_TRANSLATIONS['common.language']));

    return `
      <article class="course-uc-card">
        <div class="course-uc-card__meta">
          <span class="course-uc-card__code">${escapeHtml(uc.code || '')}</span>
          ${semester ? `<span class="course-uc-card__semester">${semesterLabel} ${escapeHtml(String(semester))}</span>` : ''}
        </div>
        <h3 class="course-uc-card__title notranslate">
          <a class="course-uc-card__link" href="${escapeHtml(url)}">${escapeHtml(uc.name || uc.title || '')}</a>
        </h3>
        ${description ? `<p class="course-uc-card__summary notranslate">${escapeHtml(description)}</p>` : ''}
        <dl class="course-uc-card__details">
          <dt>${ectsLabel}</dt>
          <dd>${escapeHtml(String(ects))}</dd>
          <dt>${languageLabel}</dt>
          <dd>${escapeHtml(language)}</dd>
        </dl>
      </article>
    `;
  };

  /**
   * Render course UCs grouped by year/semester
   * @param {string} courseCode - Course code
   * @param {Array<Object>} ucs - UC objects array
   * @returns {string} HTML sections with UC cards
   */
  const renderCourseUcs = (courseCode, ucs) => {
    if (!ucs || !ucs.length) {
      const empty = t('course.noUcs', FALLBACK_TRANSLATIONS['course.noUcs']);
      return `<div class="alert alert-warning" role="alert">${escapeHtml(empty)}</div>`;
    }

    const yearLabel = escapeHtml(t('common.year', FALLBACK_TRANSLATIONS['common.year']));
    const semesterLabel = escapeHtml(t('common.semester', FALLBACK_TRANSLATIONS['common.semester']));

    // Group UCs by year/semester
    const grouped = new Map();
    const yearOrder = [];

    ucs.forEach((uc) => {
      const year = uc.year || 1;
      const semester = uc.semester || 1;
      
      if (!grouped.has(year)) {
        grouped.set(year, new Map());
        yearOrder.push(year);
      }
      
      const semesterMap = grouped.get(year);
      if (!semesterMap.has(semester)) {
        semesterMap.set(semester, []);
      }
      
      semesterMap.get(semester).push(uc);
    });

    yearOrder.sort((a, b) => a - b);

    const sections = yearOrder
      .map((year) => {
        const semesterMap = grouped.get(year);
        const semesterSections = [1, 2]
          .map((sem) => {
            const list = semesterMap.get(sem);
            if (!list || !list.length) return '';
            
            const globalSemester = (year - 1) * 2 + sem;
            const cards = list
              .slice()
              .sort((a, b) => (a.code || '').localeCompare(b.code || ''))
              .map((uc) => renderUcCard(uc, courseCode))
              .join('');
            
            return `
              <div class="course-uc-semester">
                <h4 class="course-uc-semester__title">${semesterLabel} ${escapeHtml(String(globalSemester))}</h4>
                <div class="course-uc-grid">${cards}</div>
              </div>
            `;
          })
          .filter(Boolean)
          .join('');

        return `
          <section class="course-uc-year">
            <header class="course-uc-year__header">
              <h3 class="course-uc-year__title">${yearLabel} ${escapeHtml(String(year))}</h3>
            </header>
            ${semesterSections}
          </section>
        `;
      })
      .join('');

    return sections;
  };

  /**
   * Render UC topics as list items
   * @param {string} courseCode - Parent course code
   * @param {string} ucCode - Parent UC code
   * @param {Array<Object>} topics - Topics array
   * @returns {string} HTML list of topics
   */
  const renderUcTopics = (courseCode, ucCode, topics) => {
    if (!topics || !topics.length) {
      const empty = t('uc.noTopics', FALLBACK_TRANSLATIONS['uc.noTopics']);
      return `<div class="alert alert-info" role="alert">${escapeHtml(empty)}</div>`;
    }

    return `
      <div class="list-group list-group-flush">
        ${topics
          .slice()
          .sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''))
          .map((topic) => {
            const slug = topic.slug || '';
            const url = topic.path || `/courses/${encodeURIComponent(courseCode.toLowerCase())}/uc/${encodeURIComponent(ucCode.toLowerCase())}/${encodeURIComponent(slug)}/`;
            const summary = topic.summary || '';
            const playlistCount = Array.isArray(topic.playlists) ? topic.playlists.length : 0;
            const playlistLabel = playlistCount === 1 
              ? t('common.playlist', FALLBACK_TRANSLATIONS['common.playlist']) 
              : t('common.playlists', FALLBACK_TRANSLATIONS['common.playlists']);
            const playlistBadge = playlistCount 
              ? `<span class="badge bg-primary-subtle text-primary">${escapeHtml(`${playlistCount} ${playlistLabel}`)}</span>` 
              : '';
            const tagsHtml = renderTags(topic.tags || []);

            return `
              <a class="list-group-item list-group-item-action" href="${escapeHtml(url)}">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 class="h6 mb-1 notranslate">${escapeHtml(topic.name || topic.title || slug)}</h3>
                    ${summary ? `<p class="mb-1 small text-muted notranslate">${escapeHtml(summary)}</p>` : ''}
                  </div>
                  ${playlistBadge}
                </div>
                ${tagsHtml ? `<div class="mt-2">${tagsHtml}</div>` : ''}
              </a>
            `;
          })
          .join('')}
      </div>
    `;
  };

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Initialize page content from embedded data
   * Called automatically on page load if data attributes exist
   */
  const initPage = () => {
    const body = document.body;
    if (!body || !body.dataset) return;
    
    // Course page
    if (body.dataset.course) {
      const courseCode = body.dataset.course;
      const courseData = document.getElementById('facodi-course-data');
      if (courseData) {
        try {
          const data = JSON.parse(courseData.textContent || '{}');
          if (data.summary) {
            updateText('[data-facodi-course-summary]', data.summary);
          }
          if (data.ucs && Array.isArray(data.ucs)) {
            const container = document.querySelector('[data-facodi-slot="course-ucs"]');
            if (container) {
              container.innerHTML = renderCourseUcs(courseCode, data.ucs);
            }
            const count = document.getElementById('course-uc-count');
            if (count) {
              count.textContent = formatCount(data.ucs.length, 'common.unit', 'common.units');
            }
          }
        } catch (error) {
          console.error(`${logPrefix} Failed to parse course data.`, error);
        }
      }
    }

    // UC page
    if (body.dataset.uc) {
      const courseCode = body.dataset.course || '';
      const ucData = document.getElementById('facodi-uc-data');
      if (ucData) {
        try {
          const data = JSON.parse(ucData.textContent || '{}');
          
          if (data.description || data.summary) {
            updateText('[data-facodi-uc-summary]', data.description || data.summary || '');
          }
          
          if (data.outcomes && Array.isArray(data.outcomes)) {
            updateHTML('#uc-learning-outcomes', 
              `<h2 class="h5">${escapeHtml(t('uc.learningOutcomes', FALLBACK_TRANSLATIONS['uc.learningOutcomes']))}</h2>${renderOutcomes(data.outcomes)}`
            );
          }
          
          if (data.playlists && Array.isArray(data.playlists)) {
            updateHTML('#uc-playlists',
              `<h2 class="h5">${escapeHtml(t('uc.playlists', FALLBACK_TRANSLATIONS['uc.playlists']))}</h2>${renderPlaylists(data.playlists, { emptyKey: 'uc.noPlaylists' })}`
            );
          }
          
          if (data.prerequisites && Array.isArray(data.prerequisites) && data.prerequisites.length) {
            const elem = document.querySelector('[data-facodi-uc-prerequisites]');
            if (elem) {
              elem.textContent = data.prerequisites.join(', ');
              elem.classList.remove('text-muted');
              elem.classList.add('notranslate');
            }
          }
          
          if (data.topics && Array.isArray(data.topics)) {
            const topicsContainer = document.getElementById('uc-topics');
            if (topicsContainer) {
              updateHTML(topicsContainer,
                `<div class="d-flex align-items-center justify-content-between mb-3">
                  <h2 class="h4 mb-0">${escapeHtml(t('uc.topics', FALLBACK_TRANSLATIONS['uc.topics']))}</h2>
                  <span class="text-muted small">${formatCountHtml(data.topics.length, 'common.topic', 'common.topics')}</span>
                </div>
                ${renderUcTopics(courseCode, body.dataset.uc, data.topics)}`
              );
            }
          }
        } catch (error) {
          console.error(`${logPrefix} Failed to parse UC data.`, error);
        }
      }
    }

    // Topic page
    if (body.dataset.topic) {
      const topicData = document.getElementById('facodi-topic-data');
      if (topicData) {
        try {
          const data = JSON.parse(topicData.textContent || '{}');
          
          if (data.summary) {
            updateText('[data-facodi-topic-summary]', data.summary);
          }
          
          if (data.tags && Array.isArray(data.tags)) {
            const container = document.querySelector('[data-facodi-slot="topic-tags"]');
            if (container) {
              container.innerHTML = data.tags.length 
                ? renderTags(data.tags)
                : `<span class="text-muted small">${escapeHtml(t('topic.noTags', FALLBACK_TRANSLATIONS['topic.noTags']))}</span>`;
            }
          }
          
          if (data.playlists && Array.isArray(data.playlists)) {
            updateHTML('#topic-playlists',
              `<h2 class="h5">${escapeHtml(t('topic.relatedPlaylists', FALLBACK_TRANSLATIONS['topic.relatedPlaylists']))}</h2>${renderPlaylists(data.playlists, { emptyKey: 'topic.noPlaylists' })}`
            );
          }
        } catch (error) {
          console.error(`${logPrefix} Failed to parse topic data.`, error);
        }
      }
    }
  };

  /**
   * Refresh page when language/theme changes
   */
  const refreshPage = () => {
    // Reload translations
    translations = getTranslations();
    
    // Re-initialize with new translations
    initPage();
  };

  // ============================================================================
  // Supabase-powered Page Loaders
  // ============================================================================

  /**
   * Get the Supabase client, waiting briefly if it hasn't been initialised yet.
   * Returns null when the client is unavailable (no credentials / library missing).
   * @returns {Promise<import('@supabase/supabase-js').SupabaseClient|null>}
   */
  const getSupabaseClient = () => {
    if (window.facodiSupabase) return Promise.resolve(window.facodiSupabase);
    // Give supabaseClient.js a moment to finish initialising (it runs deferred).
    return new Promise((resolve) => {
      let attempts = 0;
      const check = setInterval(() => {
        if (window.facodiSupabase !== undefined || attempts >= 10) {
          clearInterval(check);
          resolve(window.facodiSupabase || null);
        }
        attempts++;
      }, 50);
    });
  };

  /**
   * Load and render a course page using Supabase data.
   *
   * Fetches from `catalog.course`, `catalog.course_content`, and `catalog.uc`
   * then updates the relevant DOM slots.
   *
   * @param {string} courseCode - Course code (e.g. "LESTI")
   * @param {string} [planVersion] - Optional plan version filter
   * @returns {Promise<void>}
   */
  const loadCoursePage = async (courseCode, planVersion) => {
    if (!courseCode) return;
    const db = await getSupabaseClient();
    if (!db) return; // Supabase not available; static content already rendered

    try {
      // Fetch course details
      let courseQuery = db
        .schema('catalog')
        .from('course')
        .select('*')
        .eq('code', courseCode)
        .limit(1);
      if (planVersion) courseQuery = courseQuery.eq('plan_version', planVersion);
      const { data: courseRows, error: courseErr } = await courseQuery;
      if (courseErr) throw courseErr;
      const course = courseRows && courseRows[0];

      if (course && course.summary) {
        updateText('[data-facodi-course-summary]', course.summary);
      }

      // Fetch associated UCs
      const { data: ucs, error: ucErr } = await db
        .schema('catalog')
        .from('uc')
        .select('code, name, description, ects, semester, language')
        .eq('course_code', courseCode);
      if (ucErr) throw ucErr;

      if (ucs && ucs.length) {
        const container = document.querySelector('[data-facodi-slot="course-ucs"]');
        if (container) {
          container.innerHTML = renderCourseUcs(courseCode, ucs);
        }
        const count = document.getElementById('course-uc-count');
        if (count) {
          count.textContent = formatCount(ucs.length, 'common.unit', 'common.units');
        }
      }
    } catch (err) {
      console.error(`${logPrefix} loadCoursePage error.`, err);
    }
  };

  /**
   * Load and render a UC page using Supabase data.
   *
   * Fetches from `catalog.uc`, `catalog.uc_content`, `catalog.uc_learning_outcome`,
   * `mapping.uc_playlist`, and `mapping.uc_topic` / `subjects.topic`.
   *
   * @param {string} ucCode - UC code (e.g. "19411011")
   * @returns {Promise<void>}
   */
  const loadUCPage = async (ucCode) => {
    if (!ucCode) return;
    const db = await getSupabaseClient();
    if (!db) return;

    const courseCode = (document.body.dataset && document.body.dataset.course) || '';

    try {
      // UC details
      const { data: ucRows, error: ucErr } = await db
        .schema('catalog')
        .from('uc')
        .select('*')
        .eq('code', ucCode)
        .limit(1);
      if (ucErr) throw ucErr;
      const uc = ucRows && ucRows[0];

      if (uc) {
        if (uc.description) updateText('[data-facodi-uc-summary]', uc.description);
        if (Array.isArray(uc.prerequisites) && uc.prerequisites.length) {
          const elem = document.querySelector('[data-facodi-uc-prerequisites]');
          if (elem) {
            elem.textContent = uc.prerequisites.join(', ');
            elem.classList.remove('text-muted');
            elem.classList.add('notranslate');
          }
        }
      }

      // Learning outcomes
      const { data: outcomes, error: outErr } = await db
        .schema('catalog')
        .from('uc_learning_outcome')
        .select('outcome, order')
        .eq('uc_code', ucCode)
        .order('order', { ascending: true });
      if (outErr) throw outErr;
      if (outcomes && outcomes.length) {
        updateHTML(
          '#uc-learning-outcomes',
          `<h2 class="h5">${escapeHtml(t('uc.learningOutcomes', FALLBACK_TRANSLATIONS['uc.learningOutcomes']))}</h2>${renderOutcomes(outcomes)}`
        );
      }

      // Playlists
      const { data: playlists, error: plErr } = await db
        .schema('mapping')
        .from('uc_playlist')
        .select('playlist_id, priority')
        .eq('uc_code', ucCode)
        .order('priority', { ascending: true });
      if (plErr) throw plErr;
      if (playlists && playlists.length) {
        updateHTML(
          '#uc-playlists',
          `<h2 class="h5">${escapeHtml(t('uc.playlists', FALLBACK_TRANSLATIONS['uc.playlists']))}</h2>${renderPlaylists(playlists, { emptyKey: 'uc.noPlaylists' })}`
        );
      }

      // Topics
      const { data: ucTopics, error: topErr } = await db
        .schema('mapping')
        .from('uc_topic')
        .select('topic_slug')
        .eq('uc_code', ucCode);
      if (topErr) throw topErr;
      if (ucTopics && ucTopics.length) {
        const slugs = ucTopics.map((r) => r.topic_slug);
        const { data: topics, error: tErr } = await db
          .schema('subjects')
          .from('topic')
          .select('slug, name, summary')
          .in('slug', slugs);
        if (tErr) throw tErr;
        const topicsContainer = document.getElementById('uc-topics');
        if (topicsContainer && topics && topics.length) {
          updateHTML(
            topicsContainer,
            `<div class="d-flex align-items-center justify-content-between mb-3">
              <h2 class="h4 mb-0">${escapeHtml(t('uc.topics', FALLBACK_TRANSLATIONS['uc.topics']))}</h2>
              <span class="text-muted small">${formatCountHtml(topics.length, 'common.topic', 'common.topics')}</span>
            </div>
            ${renderUcTopics(courseCode, ucCode, topics)}`
          );
        }
      }
    } catch (err) {
      console.error(`${logPrefix} loadUCPage error.`, err);
    }
  };

  /**
   * Load and render a topic page using Supabase data.
   *
   * Fetches from `subjects.topic`, `subjects.topic_content`, `subjects.topic_tag`,
   * and `mapping.topic_playlist`.
   *
   * @param {string} topicSlug - Topic slug (e.g. "estruturas-arvore")
   * @returns {Promise<void>}
   */
  const loadTopicPage = async (topicSlug) => {
    if (!topicSlug) return;
    const db = await getSupabaseClient();
    if (!db) return;

    try {
      // Topic details
      const { data: topicRows, error: topErr } = await db
        .schema('subjects')
        .from('topic')
        .select('*')
        .eq('slug', topicSlug)
        .limit(1);
      if (topErr) throw topErr;
      const topic = topicRows && topicRows[0];

      if (topic && topic.summary) {
        updateText('[data-facodi-topic-summary]', topic.summary);
      }

      // Tags
      const { data: tagRows, error: tagErr } = await db
        .schema('subjects')
        .from('topic_tag')
        .select('tag')
        .eq('topic_slug', topicSlug);
      if (tagErr) throw tagErr;
      const container = document.querySelector('[data-facodi-slot="topic-tags"]');
      if (container) {
        const tags = tagRows ? tagRows.map((r) => r.tag) : [];
        container.innerHTML = tags.length
          ? renderTags(tags)
          : `<span class="text-muted small">${escapeHtml(t('topic.noTags', FALLBACK_TRANSLATIONS['topic.noTags']))}</span>`;
      }

      // Playlists
      const { data: playlists, error: plErr } = await db
        .schema('mapping')
        .from('topic_playlist')
        .select('playlist_id, priority')
        .eq('topic_slug', topicSlug)
        .order('priority', { ascending: true });
      if (plErr) throw plErr;
      if (playlists !== null) {
        updateHTML(
          '#topic-playlists',
          `<h2 class="h5">${escapeHtml(t('topic.relatedPlaylists', FALLBACK_TRANSLATIONS['topic.relatedPlaylists']))}</h2>${renderPlaylists(playlists, { emptyKey: 'topic.noPlaylists' })}`
        );
      }
    } catch (err) {
      console.error(`${logPrefix} loadTopicPage error.`, err);
    }
  };

  // ============================================================================
  // Event Listeners & Initialization
  // ============================================================================

  if (typeof document !== 'undefined') {
    // Listen for i18n changes
    document.addEventListener('facodi:i18n-ready', (event) => {
      if (event && event.detail && event.detail.manager) {
        i18nManager = event.detail.manager;
      }
      refreshPage();
    });

    document.addEventListener('facodi:i18n-change', (event) => {
      if (event && event.detail && event.detail.manager) {
        i18nManager = event.detail.manager;
      }
      refreshPage();
    });

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPage);
    } else {
      initPage();
    }
  }

  // ============================================================================
  // Export Public API
  // ============================================================================

  window.facodiLoaders = {
    /**
     * Manually initialize page content
     * Useful if page structure changes dynamically
     */
    initPage,
    
    /**
     * Manually refresh page content after language/theme change
     */
    refreshPage,

    /**
     * Load course page content from Supabase (falls back to static if unavailable)
     * @param {string} courseCode
     * @param {string} [planVersion]
     */
    loadCoursePage,

    /**
     * Load UC page content from Supabase (falls back to static if unavailable)
     * @param {string} ucCode
     */
    loadUCPage,

    /**
     * Load topic page content from Supabase (falls back to static if unavailable)
     * @param {string} topicSlug
     */
    loadTopicPage,
    
    /**
     * Internal utilities (for testing/debugging)
     */
    _private: {
      renderMarkdown,
      renderTags,
      renderPlaylists,
      renderOutcomes,
      renderCourseUcs,
      renderUcTopics,
      escapeHtml,
      formatCount
    }
  };

  console.info(`${logPrefix} Loaders initialised.`);
})();
