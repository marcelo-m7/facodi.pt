export type AppView =
  | 'home'
  | 'courses'
  | 'repository'
  | 'course-detail'
  | 'lesson-detail'
  | 'videos'
  | 'video-detail'
  | 'curator-submit'
  | 'admin-content-detail'
  | 'blog-post'
  | 'not-found';

export function generateRoute(view: AppView, params: { unitId?: string; lessonId?: string; videoId?: string; submissionId?: string; blogSlug?: string } = {}): string {
  switch (view) {
    case 'courses': return '/courses';
    case 'repository': return '/courses/units';
    case 'course-detail': return params.unitId ? `/courses/units/${params.unitId}` : '/courses/units';
    case 'lesson-detail': return params.lessonId ? `/lessons/${params.lessonId}` : '/courses/units';
    case 'videos': return '/videos';
    case 'video-detail': return params.videoId ? `/videos/${params.videoId}` : '/videos';
    case 'curator-submit': return '/curator/submit';
    case 'admin-content-detail': return params.submissionId ? `/admin/conteudos/${params.submissionId}` : '/admin/conteudos';
    case 'blog-post': return params.blogSlug ? `/blog/${params.blogSlug}` : '/blog';
    case 'home': return '/';
    default: return '/';
  }
}

export function parseRoute(path: string): { view: AppView; param?: string } {
  if (path.startsWith('/blog/')) return { view: 'blog-post', param: path.split('/')[2] };
  if (path.startsWith('/admin/conteudos/')) return { view: 'admin-content-detail', param: path.split('/')[3] };
  if (path.startsWith('/videos/')) return { view: 'video-detail', param: path.split('/')[2] };
  if (path.startsWith('/lessons/')) return { view: 'lesson-detail', param: path.split('/')[2] };
  if (path.startsWith('/courses/units/')) return { view: 'course-detail', param: path.split('/')[3] };
  if (path === '/courses/units') return { view: 'repository' };
  if (path === '/courses') return { view: 'courses' };
  if (path === '/videos') return { view: 'videos' };
  if (path === '/curator/submit') return { view: 'curator-submit' };
  if (path === '/') return { view: 'home' };
  return { view: 'not-found' };
}
