/**
 * Tests for FACODI service layer
 *
 * Services are tested by injecting custom adapters so tests are fully
 * decoupled from the DOM and from any external back-end.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCoursePage,
  configureAdapter as configureCourseAdapter,
} from '../../static/js/facodi/services/courseService.js';
import {
  loadUCPage,
  configureAdapter as configureUCAdapter,
} from '../../static/js/facodi/services/ucService.js';
import {
  loadTopicPage,
  configureAdapter as configureTopicAdapter,
} from '../../static/js/facodi/services/topicService.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeCourseAdapter = (data) => ({
  getCourse: () => Promise.resolve(data),
});

const makeUCAdapter = (data) => ({
  getUC: () => Promise.resolve(data),
});

const makeTopicAdapter = (data) => ({
  getTopic: () => Promise.resolve(data),
});

// ---------------------------------------------------------------------------
// courseService
// ---------------------------------------------------------------------------

describe('courseService', () => {
  beforeEach(() => {
    configureCourseAdapter(makeCourseAdapter(null));
  });

  it('returns null when adapter has no data', async () => {
    const result = await loadCoursePage('LESTI');
    expect(result).toBeNull();
  });

  it('forwards course data from the adapter', async () => {
    const mockData = { code: 'LESTI', name: 'Eng. Informática', ucs: [] };
    configureCourseAdapter(makeCourseAdapter(mockData));

    const result = await loadCoursePage('LESTI');
    expect(result).toEqual(mockData);
  });

  it('accepts a planVersion argument without error', async () => {
    const mockData = { code: 'LESTI', plan_version: '2024/2025' };
    configureCourseAdapter(makeCourseAdapter(mockData));

    const result = await loadCoursePage('LESTI', '2024/2025');
    expect(result.plan_version).toBe('2024/2025');
  });
});

// ---------------------------------------------------------------------------
// ucService
// ---------------------------------------------------------------------------

describe('ucService', () => {
  beforeEach(() => {
    configureUCAdapter(makeUCAdapter(null));
  });

  it('returns null when adapter has no data', async () => {
    const result = await loadUCPage('ALG1');
    expect(result).toBeNull();
  });

  it('forwards UC data from the adapter', async () => {
    const mockData = {
      code: 'ALG1',
      name: 'Algoritmos I',
      ects: 6,
      outcomes: ['Outcome A'],
      playlists: [],
      topics: [],
    };
    configureUCAdapter(makeUCAdapter(mockData));

    const result = await loadUCPage('ALG1');
    expect(result).toEqual(mockData);
    expect(result.outcomes).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// topicService
// ---------------------------------------------------------------------------

describe('topicService', () => {
  beforeEach(() => {
    configureTopicAdapter(makeTopicAdapter(null));
  });

  it('returns null when adapter has no data', async () => {
    const result = await loadTopicPage('variables');
    expect(result).toBeNull();
  });

  it('forwards topic data from the adapter', async () => {
    const mockData = {
      slug: 'variables',
      name: 'Variables',
      tags: ['basics', 'programming'],
      playlists: [{ id: 'PL123', priority: 1 }],
    };
    configureTopicAdapter(makeTopicAdapter(mockData));

    const result = await loadTopicPage('variables');
    expect(result).toEqual(mockData);
    expect(result.tags).toContain('basics');
  });

  it('adapter receives the topic slug', async () => {
    const received = [];
    configureTopicAdapter({
      getTopic: (slug) => {
        received.push(slug);
        return Promise.resolve(null);
      },
    });

    await loadTopicPage('my-slug');
    expect(received).toEqual(['my-slug']);
  });
});
