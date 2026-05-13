import { useEffect, type FC } from 'react';

type SeoType = 'website' | 'article';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  image: string;
  type?: SeoType;
  noindex?: boolean;
  locale?: string;
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

function ensureMeta(selector: string, attribute: 'name' | 'property', key: string): HTMLMetaElement {
  const existing = document.querySelector(selector) as HTMLMetaElement | null;
  if (existing) {
    return existing;
  }

  const meta = document.createElement('meta');
  meta.setAttribute(attribute, key);
  document.head.appendChild(meta);
  return meta;
}

function ensureCanonical(): HTMLLinkElement {
  const existing = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (existing) {
    return existing;
  }

  const link = document.createElement('link');
  link.setAttribute('rel', 'canonical');
  document.head.appendChild(link);
  return link;
}

const SEOHead: FC<SEOHeadProps> = ({
  title,
  description,
  canonical,
  image,
  type = 'website',
  noindex = false,
  locale = 'pt_PT',
  siteName = 'FACODI',
  twitterCard = 'summary_large_image',
  structuredData,
}) => {
  useEffect(() => {
    const fullTitle = title.includes('FACODI') ? title : `${title} | FACODI`;
    document.title = fullTitle;

    ensureMeta('meta[name="description"]', 'name', 'description').setAttribute('content', description);
    ensureMeta('meta[name="robots"]', 'name', 'robots').setAttribute('content', noindex ? 'noindex,nofollow' : 'index,follow');

    ensureMeta('meta[property="og:title"]', 'property', 'og:title').setAttribute('content', fullTitle);
    ensureMeta('meta[property="og:description"]', 'property', 'og:description').setAttribute('content', description);
    ensureMeta('meta[property="og:type"]', 'property', 'og:type').setAttribute('content', type);
    ensureMeta('meta[property="og:url"]', 'property', 'og:url').setAttribute('content', canonical);
    ensureMeta('meta[property="og:image"]', 'property', 'og:image').setAttribute('content', image);
    ensureMeta('meta[property="og:site_name"]', 'property', 'og:site_name').setAttribute('content', siteName);
    ensureMeta('meta[property="og:locale"]', 'property', 'og:locale').setAttribute('content', locale);

    ensureMeta('meta[name="twitter:card"]', 'name', 'twitter:card').setAttribute('content', twitterCard);
    ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title').setAttribute('content', fullTitle);
    ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description').setAttribute('content', description);
    ensureMeta('meta[name="twitter:image"]', 'name', 'twitter:image').setAttribute('content', image);

    const canonicalLink = ensureCanonical();
    canonicalLink.setAttribute('href', canonical);

    const oldScript = document.getElementById('facodi-structured-data');
    if (oldScript) {
      oldScript.remove();
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.id = 'facodi-structured-data';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [canonical, description, image, locale, noindex, siteName, structuredData, title, twitterCard, type]);

  return null;
};

export default SEOHead;