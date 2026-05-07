import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ContentPage } from '../types';

let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('[contentSource] VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required');
  _supabase = createClient(url, key);
  return _supabase;
}

/**
 * Load a single institutional content page by slug.
 * Returns null on not-found or any error (caller handles fallback).
 */
export async function loadContentPage(slug: string): Promise<ContentPage | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('content_pages')
      .select('slug, title_pt, title_en, body_pt, body_en, published')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      console.error(`[contentSource:supabase] Error loading page "${slug}":`, error.message);
      return null;
    }
    if (!data) return null;

    return {
      slug: data.slug as string,
      titlePt: data.title_pt as string,
      titleEn: (data.title_en as string | null) ?? undefined,
      bodyPt: (data.body_pt as string) || '',
      bodyEn: (data.body_en as string | null) ?? undefined,
      published: data.published as boolean,
    };
  } catch (err) {
    console.error(`[contentSource:supabase] Unexpected error loading page "${slug}":`, err);
    return null;
  }
}
