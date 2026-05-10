import { describe, expect, it } from 'vitest';
import { buildSeoMetadata } from './seoMetadata';

describe('seo metadata builder', () => {
  it('builds public metadata', () => {
    const seo = buildSeoMetadata('courses', 'https://facodi.open2.tech/');
    expect(seo.title).toContain('Cursos abertos');
    expect(seo.canonical).toBe('https://facodi.open2.tech/courses');
    expect(seo.noindex).toBe(false);
  });

  it('marks admin pages as noindex', () => {
    const seo = buildSeoMetadata('admin-dashboard', 'https://facodi.open2.tech');
    expect(seo.noindex).toBe(true);
  });
});
