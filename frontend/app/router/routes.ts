export type View =
  | 'home'
  | 'not-found'
  | 'courses'
  | 'repository'
  | 'paths'
  | 'contributors'
  | 'course-detail'
  | 'lesson-detail'
  | 'playlists'
  | 'dashboard'
  | 'institutional-page'
  | 'videos'
  | 'video-detail'
  | 'profile'
  | 'student-dashboard'
  | 'student-my-courses'
  | 'student-progress'
  | 'student-history'
  | 'curator-apply'
  | 'curator-submit'
  | 'curator-submissions'
  | 'curator-channel-pipeline'
  | 'curator-admin-review'
  | 'curator-channel-curation'
  | 'admin-dashboard'
  | 'admin-contents'
  | 'admin-content-detail'
  | 'admin-curators'
  | 'blog'
  | 'blog-post';

export type RouteAccess = 'public' | 'private' | 'editor' | 'admin';

type RouteParams = {
  unitId?: string | null;
  lessonId?: string | null;
  videoId?: string | null;
  blogSlug?: string | null;
  pageSlug?: string | null;
  submissionId?: string | null;
};

type RouteMatch = { view: View; params?: RouteParams };

type RouteDef = {
  view: View;
  template: string;
  access: RouteAccess;
  toPath: (params?: RouteParams) => string;
  match: (path: string) => RouteMatch | null;
};

const INSTITUTIONAL_SLUGS = new Set(['manifesto', 'sobre', 'comunidade', 'roadmap', 'infraestrutura', 'como-contribuir', 'sobre-marcelo', 'sobre-ualg', 'sobre-open2', 'modelo-academico']);

export const ROUTES: RouteDef[] = [
  { view: 'home', template: '/', access: 'public', toPath: () => '/', match: (p) => p === '/' ? { view: 'home' } : null },
  { view: 'courses', template: '/courses', access: 'public', toPath: () => '/courses', match: (p) => p === '/courses' ? { view: 'courses' } : null },
  { view: 'repository', template: '/courses/units', access: 'public', toPath: () => '/courses/units', match: (p) => p === '/courses/units' ? { view: 'repository' } : null },
  { view: 'course-detail', template: '/courses/units/:unitId', access: 'public', toPath: (x) => x?.unitId ? `/courses/units/${x.unitId}` : '/courses/units', match: (p) => p.startsWith('/courses/units/') ? ({ view: 'course-detail', params: { unitId: p.replace('/courses/units/', '').split('/')[0] } }) : null },
  { view: 'lesson-detail', template: '/lessons/:lessonId', access: 'public', toPath: (x) => x?.lessonId ? `/lessons/${x.lessonId}` : '/courses/units', match: (p) => p.startsWith('/lessons/') ? ({ view: 'lesson-detail', params: { lessonId: p.replace('/lessons/', '').split('/')[0] } }) : null },
  { view: 'videos', template: '/videos', access: 'public', toPath: () => '/videos', match: (p) => p === '/videos' ? { view: 'videos' } : null },
  { view: 'video-detail', template: '/videos/:videoId', access: 'public', toPath: (x) => x?.videoId ? `/videos/${x.videoId}` : '/videos', match: (p) => p.startsWith('/videos/') ? ({ view: 'video-detail', params: { videoId: p.replace('/videos/', '').split('/')[0] } }) : null },
  { view: 'dashboard', template: '/dashboard', access: 'private', toPath: () => '/dashboard', match: (p) => p === '/dashboard' ? { view: 'dashboard' } : null },
  { view: 'playlists', template: '/playlists', access: 'public', toPath: () => '/playlists', match: (p) => p === '/playlists' ? { view: 'playlists' } : null },
  { view: 'contributors', template: '/contributors', access: 'public', toPath: () => '/contributors', match: (p) => p === '/contributors' ? { view: 'contributors' } : null },
  { view: 'profile', template: '/profile', access: 'private', toPath: () => '/profile', match: (p) => p === '/profile' ? { view: 'profile' } : null },
  { view: 'institutional-page', template: '/:pageSlug', access: 'public', toPath: (x) => x?.pageSlug ? `/${x.pageSlug}` : '/', match: (p) => { const slug = p.replace('/', ''); return INSTITUTIONAL_SLUGS.has(slug) ? { view: 'institutional-page', params: { pageSlug: slug } } : null; } },
  { view: 'student-dashboard', template: '/student/dashboard', access: 'private', toPath: () => '/student/dashboard', match: (p) => p === '/student/dashboard' ? { view: 'student-dashboard' } : null },
  { view: 'student-my-courses', template: '/student/my-courses', access: 'private', toPath: () => '/student/my-courses', match: (p) => p === '/student/my-courses' ? { view: 'student-my-courses' } : null },
  { view: 'student-progress', template: '/student/progress', access: 'private', toPath: () => '/student/progress', match: (p) => p === '/student/progress' ? { view: 'student-progress' } : null },
  { view: 'student-history', template: '/student/history', access: 'private', toPath: () => '/student/history', match: (p) => p === '/student/history' ? { view: 'student-history' } : null },
  { view: 'curator-apply', template: '/curator/apply', access: 'private', toPath: () => '/curator/apply', match: (p) => p === '/curator/apply' ? { view: 'curator-apply' } : null },
  { view: 'curator-submit', template: '/curator/submit', access: 'editor', toPath: () => '/curator/submit', match: (p) => p === '/curator/submit' ? { view: 'curator-submit' } : null },
  { view: 'curator-submissions', template: '/curator/submissions', access: 'private', toPath: () => '/curator/submissions', match: (p) => p === '/curator/submissions' ? { view: 'curator-submissions' } : null },
  { view: 'curator-channel-pipeline', template: '/curator/channel-pipeline', access: 'private', toPath: () => '/curator/channel-pipeline', match: (p) => p === '/curator/channel-pipeline' ? { view: 'curator-channel-pipeline' } : null },
  { view: 'curator-admin-review', template: '/curator/admin-review', access: 'admin', toPath: () => '/curator/admin-review', match: (p) => p === '/curator/admin-review' ? { view: 'curator-admin-review' } : null },
  { view: 'curator-channel-curation', template: '/curator/channel-curation', access: 'admin', toPath: () => '/curator/channel-curation', match: (p) => p === '/curator/channel-curation' ? { view: 'curator-channel-curation' } : null },
  { view: 'admin-dashboard', template: '/admin', access: 'admin', toPath: () => '/admin', match: (p) => p === '/admin' ? { view: 'admin-dashboard' } : null },
  { view: 'admin-contents', template: '/admin/conteudos', access: 'admin', toPath: () => '/admin/conteudos', match: (p) => p === '/admin/conteudos' ? { view: 'admin-contents' } : null },
  { view: 'admin-content-detail', template: '/admin/conteudos/:submissionId', access: 'admin', toPath: (x) => x?.submissionId ? `/admin/conteudos/${x.submissionId}` : '/admin/conteudos', match: (p) => p.startsWith('/admin/conteudos/') ? ({ view: 'admin-content-detail', params: { submissionId: p.replace('/admin/conteudos/', '').split('/')[0] } }) : null },
  { view: 'admin-curators', template: '/admin/curadores', access: 'admin', toPath: () => '/admin/curadores', match: (p) => p === '/admin/curadores' ? { view: 'admin-curators' } : null },
  { view: 'blog', template: '/blog', access: 'public', toPath: () => '/blog', match: (p) => p === '/blog' ? { view: 'blog' } : null },
  { view: 'blog-post', template: '/blog/:blogSlug', access: 'public', toPath: (x) => x?.blogSlug ? `/blog/${x.blogSlug}` : '/blog', match: (p) => p.startsWith('/blog/') ? ({ view: 'blog-post', params: { blogSlug: p.replace('/blog/', '').split('/')[0] } }) : null },
];

export function toPath(view: View, params?: RouteParams): string {
  return ROUTES.find((r) => r.view === view)?.toPath(params) ?? '/';
}

export function fromPath(pathname: string): RouteMatch {
  for (const route of ROUTES) {
    const matched = route.match(pathname);
    if (matched) return matched;
  }
  return { view: 'not-found' };
}
