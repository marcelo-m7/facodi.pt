/**
 * Tests for FACODI core utilities
 */

import { describe, it, expect } from 'vitest';
import { escapeHtml, formatCount, safeJsonParse, sortByKey } from '../../static/js/facodi/core/utils.js';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('returns empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('preserves plain text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('coerces numbers to strings', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('formatCount', () => {
  it('returns singular form for count of 1', () => {
    expect(formatCount(1, 'item', 'items')).toBe('1 item');
  });

  it('returns plural form for count of 0', () => {
    expect(formatCount(0, 'item', 'items')).toBe('0 items');
  });

  it('returns plural form for count > 1', () => {
    expect(formatCount(5, 'course', 'courses')).toBe('5 courses');
  });

  it('handles Portuguese labels', () => {
    expect(formatCount(3, 'tópico', 'tópicos')).toBe('3 tópicos');
  });
});

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns null fallback for invalid JSON', () => {
    expect(safeJsonParse('not-json')).toBe(null);
  });

  it('returns custom fallback for invalid JSON', () => {
    expect(safeJsonParse('bad', [])).toEqual([]);
  });

  it('returns fallback for empty string', () => {
    expect(safeJsonParse('')).toBe(null);
  });
});

describe('sortByKey', () => {
  it('sorts by numeric key ascending', () => {
    const items = [{ p: 3 }, { p: 1 }, { p: 2 }];
    expect(sortByKey(items, 'p')).toEqual([{ p: 1 }, { p: 2 }, { p: 3 }]);
  });

  it('treats missing key as 0', () => {
    const items = [{ p: 2 }, {}, { p: 1 }];
    const sorted = sortByKey(items, 'p');
    expect(sorted[0]).toEqual({});
    expect(sorted[1]).toEqual({ p: 1 });
  });

  it('does not mutate the original array', () => {
    const items = [{ p: 2 }, { p: 1 }];
    const sorted = sortByKey(items, 'p');
    expect(items[0].p).toBe(2);
    expect(sorted[0].p).toBe(1);
  });
});
