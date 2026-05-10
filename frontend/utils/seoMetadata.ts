export function buildSeoMetadata(view: string, siteUrl: string) {
  const base = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  const defaults = {
    title: 'FACODI - Faculdade Comunitaria Digital',
    description: 'Plataforma aberta e comunitaria de educacao digital.',
    canonical: `${base}/`,
    type: 'website',
    noindex: false,
  };

  if (view === 'courses') {
    return { ...defaults, title: 'Cursos abertos | FACODI', canonical: `${base}/courses` };
  }

  if (view === 'admin-dashboard') {
    return { ...defaults, title: 'Admin | FACODI', canonical: `${base}/admin`, noindex: true };
  }

  return defaults;
}
