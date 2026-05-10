import { describe, expect, it } from 'vitest';
import { fromPath, ROUTES, toPath, type View } from './routes';

const SAMPLE_PARAMS: Record<View, Record<string, string>> = {
  'home': {}, 'not-found': {}, 'courses': {}, 'repository': {}, 'paths': {}, 'contributors': {},
  'course-detail': { unitId: 'u1' }, 'lesson-detail': { lessonId: 'l1' }, 'playlists': {}, 'dashboard': {},
  'institutional-page': { pageSlug: 'manifesto' }, 'videos': {}, 'video-detail': { videoId: 'v1' }, 'profile': {},
  'student-dashboard': {}, 'student-my-courses': {}, 'student-progress': {}, 'student-history': {},
  'curator-apply': {}, 'curator-submit': {}, 'curator-submissions': {}, 'curator-channel-pipeline': {},
  'curator-admin-review': {}, 'curator-channel-curation': {}, 'admin-dashboard': {}, 'admin-contents': {},
  'admin-content-detail': { submissionId: 's1' }, 'admin-curators': {}, 'blog': {}, 'blog-post': { blogSlug: 'hello' },
};

describe('routes registry round-trip', () => {
  it('covers all defined routes with view -> path -> view consistency', () => {
    for (const route of ROUTES) {
      const path = toPath(route.view, SAMPLE_PARAMS[route.view]);
      const parsed = fromPath(path);
      expect(parsed.view).toBe(route.view);
    }
  });

  it('resolves unknown routes to not-found', () => {
    expect(fromPath('/definitely/unknown')).toEqual({ view: 'not-found' });
  });
});
