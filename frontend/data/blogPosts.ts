import postDesignRaw from '../content/blog/design-tecnologia-inclusiva.md?raw';
import postOpen2Raw from '../content/blog/por-tras-da-open2.md?raw';

export interface BlogPostMeta {
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  published: boolean;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

function parseFrontmatter(markdown: string): BlogPost {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid markdown frontmatter format.');
  }

  const [, frontmatterBlock, content] = match;
  const lines = frontmatterBlock.split('\n');

  const frontmatter: Record<string, string | boolean | string[]> = {};
  let currentArrayKey: string | null = null;

  for (const line of lines) {
    if (line.startsWith('  - ') && currentArrayKey) {
      const arrayValue = line.replace('  - ', '').replace(/^"|"$/g, '');
      const current = frontmatter[currentArrayKey] as string[];
      current.push(arrayValue);
      continue;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (value === '') {
      frontmatter[key] = [];
      currentArrayKey = key;
      continue;
    }

    currentArrayKey = null;
    if (value === 'true') {
      frontmatter[key] = true;
    } else if (value === 'false') {
      frontmatter[key] = false;
    } else {
      frontmatter[key] = value.replace(/^"|"$/g, '');
    }
  }

  return {
    title: String(frontmatter.title ?? ''),
    slug: String(frontmatter.slug ?? ''),
    excerpt: String(frontmatter.description ?? ''),
    date: String(frontmatter.date ?? ''),
    author: String(frontmatter.author ?? 'FACODI'),
    category: String(frontmatter.category ?? 'Blog'),
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    published: frontmatter.published !== false,
    content: content.trim(),
  };
}

export const blogPosts: BlogPost[] = [
  parseFrontmatter(postDesignRaw),
  parseFrontmatter(postOpen2Raw),
];

export function getPublishedPosts(): BlogPost[] {
  return blogPosts
    .filter((post) => post.published)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug && post.published);
}

export function sortPostsByDate(posts: BlogPostMeta[]): BlogPostMeta[] {
  return [...posts].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
}