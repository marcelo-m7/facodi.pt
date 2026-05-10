import React, { useMemo } from 'react';
import { createTranslator, type Locale } from '../../data/i18n';
import { getPostBySlug } from '../../data/blogPosts';
import MarkdownView from '../MarkdownView';

interface BlogPostPageProps {
  slug: string;
  locale: Locale;
  onBack: () => void;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, locale, onBack }) => {
  const t = createTranslator(locale);
  const post = useMemo(() => getPostBySlug(slug), [slug]);

  if (!post) {
    return (
      <section className="facodi-page max-w-[1600px] mx-auto">
        <div className="facodi-card text-center py-12">
          <h1 className="text-3xl font-bold mb-8">Artigo não encontrado</h1>
          <button
            type="button"
            onClick={onBack}
            className="facodi-btn facodi-btn-secondary"
          >
            {t('blog.backToList')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <article className="facodi-page max-w-[1600px] mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="facodi-nav-link mb-12 inline-flex items-center gap-2"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        {t('blog.backToList')}
      </button>

      <header className="facodi-card p-8 lg:p-12 mb-10">
        <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <span className="facodi-badge facodi-badge-neon">
            {post.category}
          </span>
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {new Date(post.date).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
          </span>
        </div>

        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[0.95] mb-6">
          {post.title}
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">{post.excerpt}</p>

        <p className="text-base text-gray-600 dark:text-gray-400 font-medium mb-6">
          {t('blog.by')} <strong>{post.author}</strong>
        </p>

        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="facodi-badge facodi-badge-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="facodi-card p-8 lg:p-12">
        <MarkdownView content={post.content} />
      </div>
    </article>
  );
};

export default BlogPostPage;