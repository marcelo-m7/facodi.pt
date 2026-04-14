/**
 * Tests for FACODI UI Renderers
 */

import { describe, it, expect } from 'vitest';
import {
  renderTags,
  renderPlaylists,
  renderOutcomes,
  renderUcCard,
  renderCourseUcs,
  renderUcTopics,
} from '../../static/js/facodi/ui/renderers.js';

// ---------------------------------------------------------------------------
// renderTags
// ---------------------------------------------------------------------------

describe('renderTags', () => {
  it('renders tags as badge spans', () => {
    const html = renderTags(['python', 'web']);
    expect(html).toContain('python');
    expect(html).toContain('web');
    expect(html).toContain('<span class="badge');
  });

  it('escapes dangerous tag content', () => {
    const html = renderTags(['<script>']);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('returns empty string for empty array', () => {
    expect(renderTags([])).toBe('');
  });

  it('returns empty string for null', () => {
    expect(renderTags(null)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// renderPlaylists
// ---------------------------------------------------------------------------

describe('renderPlaylists', () => {
  it('renders YouTube playlist links', () => {
    const html = renderPlaylists([{ id: 'PLtest123', priority: 1 }]);
    expect(html).toContain('youtube.com/playlist');
    expect(html).toContain('PLtest123');
  });

  it('accepts playlist_id as alternative id field', () => {
    const html = renderPlaylists([{ playlist_id: 'PLfoo' }]);
    expect(html).toContain('PLfoo');
  });

  it('returns fallback message for empty array', () => {
    const html = renderPlaylists([]);
    expect(html.length).toBeGreaterThan(0);
  });

  it('returns fallback message for null', () => {
    const html = renderPlaylists(null);
    expect(html.length).toBeGreaterThan(0);
  });

  it('escapes playlist IDs to prevent XSS', () => {
    const html = renderPlaylists([{ id: 'PL"evil"' }]);
    expect(html).toContain('&quot;');
    expect(html).not.toContain('PL"evil"');
  });

  it('sorts playlists by priority', () => {
    const html = renderPlaylists([
      { id: 'PL_B', priority: 2 },
      { id: 'PL_A', priority: 1 },
    ]);
    expect(html.indexOf('PL_A')).toBeLessThan(html.indexOf('PL_B'));
  });

  it('opens links in a new tab with rel=noopener', () => {
    const html = renderPlaylists([{ id: 'PLx' }]);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
  });
});

// ---------------------------------------------------------------------------
// renderOutcomes
// ---------------------------------------------------------------------------

describe('renderOutcomes', () => {
  it('renders an ordered list of string outcomes', () => {
    const html = renderOutcomes(['Understand variables', 'Write functions']);
    expect(html).toContain('<ol');
    expect(html).toContain('Understand variables');
    expect(html).toContain('Write functions');
  });

  it('renders outcome objects with order sorting', () => {
    const html = renderOutcomes([
      { outcome: 'Second', order: 2 },
      { outcome: 'First', order: 1 },
    ]);
    expect(html.indexOf('First')).toBeLessThan(html.indexOf('Second'));
  });

  it('returns empty-state message for empty array', () => {
    const html = renderOutcomes([]);
    expect(html).toContain('<p');
  });

  it('escapes outcome text', () => {
    const html = renderOutcomes(['<b>Bold</b>']);
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;');
  });
});

// ---------------------------------------------------------------------------
// renderUcCard
// ---------------------------------------------------------------------------

describe('renderUcCard', () => {
  const uc = {
    code: 'ALG1',
    name: 'Algoritmos I',
    ects: 6,
    semester: 1,
    language: 'Português',
  };

  it('renders UC name and code', () => {
    const html = renderUcCard(uc, 'LESTI');
    expect(html).toContain('ALG1');
    expect(html).toContain('Algoritmos I');
  });

  it('builds a link using course and UC codes', () => {
    const html = renderUcCard(uc, 'LESTI');
    expect(html).toContain('/courses/lesti/uc/alg1/');
  });

  it('uses custom path when uc.path is supplied', () => {
    const html = renderUcCard({ ...uc, path: '/custom/path/' }, 'LESTI');
    expect(html).toContain('/custom/path/');
  });

  it('escapes name to prevent XSS', () => {
    const html = renderUcCard({ ...uc, name: '<b>Hack</b>' }, 'LESTI');
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;');
  });
});

// ---------------------------------------------------------------------------
// renderCourseUcs
// ---------------------------------------------------------------------------

describe('renderCourseUcs', () => {
  const ucs = [
    { code: 'UC1', name: 'Prog I', year: 1, semester: 1, ects: 6, language: 'PT' },
    { code: 'UC2', name: 'Prog II', year: 1, semester: 2, ects: 6, language: 'PT' },
  ];

  it('renders UC cards grouped by year', () => {
    const html = renderCourseUcs('LESTI', ucs);
    expect(html).toContain('Prog I');
    expect(html).toContain('Prog II');
  });

  it('shows empty-state alert when UCs list is empty', () => {
    const html = renderCourseUcs('LESTI', []);
    expect(html).toContain('alert');
  });

  it('shows empty-state alert for null', () => {
    const html = renderCourseUcs('LESTI', null);
    expect(html).toContain('alert');
  });
});

// ---------------------------------------------------------------------------
// renderUcTopics
// ---------------------------------------------------------------------------

describe('renderUcTopics', () => {
  const topics = [
    { slug: 'vars', name: 'Variables', tags: ['basics'], playlists: [{ id: 'PL1' }] },
    { slug: 'loops', name: 'Loops', tags: [], playlists: [] },
  ];

  it('renders topic names as list items', () => {
    const html = renderUcTopics('LESTI', 'ALG1', topics);
    expect(html).toContain('Variables');
    expect(html).toContain('Loops');
  });

  it('builds topic URLs from course and UC codes', () => {
    const html = renderUcTopics('LESTI', 'ALG1', topics);
    expect(html).toContain('/courses/lesti/uc/alg1/vars/');
  });

  it('shows empty-state alert for empty topics', () => {
    const html = renderUcTopics('LESTI', 'ALG1', []);
    expect(html).toContain('alert');
  });
});
