import { describe, expect, it } from 'vitest';
import { generateRoute, parseRoute } from './routeRegistry';

describe('route registry', () => {
  it('generates detail routes', () => {
    expect(generateRoute('course-detail', { unitId: 'u1' })).toBe('/courses/units/u1');
    expect(generateRoute('blog-post', { blogSlug: 'hello' })).toBe('/blog/hello');
  });

  it('parses known paths', () => {
    expect(parseRoute('/videos/v1')).toEqual({ view: 'video-detail', param: 'v1' });
    expect(parseRoute('/curator/submit')).toEqual({ view: 'curator-submit' });
  });
});
