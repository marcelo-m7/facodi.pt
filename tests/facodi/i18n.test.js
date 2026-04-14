/**
 * Tests for FACODI i18n core module
 */

import { describe, it, expect } from 'vitest';
import {
  FALLBACK_TRANSLATIONS,
  createTranslator,
} from '../../static/js/facodi/core/i18n.js';

describe('FALLBACK_TRANSLATIONS', () => {
  it('contains expected keys', () => {
    expect(FALLBACK_TRANSLATIONS['common.unit']).toBeDefined();
    expect(FALLBACK_TRANSLATIONS['common.units']).toBeDefined();
    expect(FALLBACK_TRANSLATIONS['uc.topics']).toBeDefined();
    expect(FALLBACK_TRANSLATIONS['topic.relatedPlaylists']).toBeDefined();
  });
});

describe('createTranslator', () => {
  it('returns empty string for falsy keys', () => {
    const t = createTranslator();
    expect(t('')).toBe('');
    expect(t(null)).toBe('');
  });

  it('uses fallback parameter when key is missing', () => {
    const t = createTranslator();
    expect(t('nonexistent.key', 'my fallback')).toBe('my fallback');
  });

  it('resolves keys from FALLBACK_TRANSLATIONS when no other source available', () => {
    const t = createTranslator();
    expect(t('common.unit')).toBe(FALLBACK_TRANSLATIONS['common.unit']);
  });

  it('prefers page-embedded translations over fallback constants', () => {
    const t = createTranslator({ translations: { 'common.unit': 'unité' } });
    expect(t('common.unit')).toBe('unité');
  });

  it('prefers i18n manager over embedded translations', () => {
    const manager = { translate: (key) => (key === 'common.unit' ? 'unit (manager)' : '') };
    const t = createTranslator({
      translations: { 'common.unit': 'unité' },
      manager,
    });
    expect(t('common.unit')).toBe('unit (manager)');
  });

  it('falls through manager when manager returns empty string', () => {
    const manager = { translate: () => '' };
    const t = createTranslator({
      translations: { 'common.unit': 'from-embedded' },
      manager,
    });
    expect(t('common.unit')).toBe('from-embedded');
  });

  it('returns empty string when nothing resolves', () => {
    const t = createTranslator();
    expect(t('completely.missing.key')).toBe('');
  });
});
