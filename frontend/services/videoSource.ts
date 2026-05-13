import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PublicPlaylist, VideoCategory, VideoItem } from '../types';

type VideoRow = {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  channel_name: string;
  duration_seconds: number | null;
  thumbnail_url: string;
  language: string;
  category_id: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  } | null;
};

type PlaylistVideoRow = {
  id: string;
  position: number;
  playlist?: {
    id: string;
    name: string;
    slug: string;
  } | Array<{
    id: string;
    name: string;
    slug: string;
  }> | null;
  video?: VideoRow | null;
};

export type VideoQueryParams = {
  search?: string;
  categoryId?: string;
  playlistId?: string;
  limit?: number;
  offset?: number;
};

let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error('[videoSource] VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required');
  }

  _supabase = createClient(url, key);
  return _supabase;
}

function mapVideoRow(row: VideoRow): VideoItem {
  return {
    id: row.id,
    youtubeId: row.youtube_id,
    title: row.title,
    description: row.description || '',
    channelName: row.channel_name,
    durationSeconds: row.duration_seconds ?? undefined,
    thumbnailUrl: row.thumbnail_url,
    language: row.language,
    categoryId: row.category_id ?? undefined,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          slug: row.category.slug,
          color: row.category.color,
        }
      : undefined,
  };
}

export async function listPublicCategories(): Promise<VideoCategory[]> {
  const sb = getSupabaseClient();

  const { data, error } = await sb
    .schema('public')
    .from('categories')
    .select('id, name, slug, color')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`[videoSource] categories: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
  }));
}

export async function listPublicPlaylists(): Promise<PublicPlaylist[]> {
  const sb = getSupabaseClient();

  const { data, error } = await sb
    .schema('public')
    .from('playlists')
    .select('id, name, slug, description, course_code, unit_code, video_count, total_duration_seconds')
    .eq('is_public', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`[videoSource] playlists: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    courseCode: row.course_code ?? undefined,
    unitCode: row.unit_code ?? undefined,
    videoCount: row.video_count || 0,
    totalDurationSeconds: row.total_duration_seconds ?? undefined,
  }));
}

export async function listPlaylistVideos(playlistId: string): Promise<VideoItem[]> {
  const sb = getSupabaseClient();

  const { data, error } = await sb
    .schema('public')
    .from('playlist_videos')
    .select(`
      id,
      position,
      playlist:playlists!playlist_videos_playlist_id_fkey(id, name, slug),
      video:videos!playlist_videos_video_id_fkey(
        id,
        youtube_id,
        title,
        description,
        channel_name,
        duration_seconds,
        thumbnail_url,
        language,
        category_id,
        category:categories(id, name, slug, color)
      )
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`[videoSource] playlist_videos: ${error.message}`);
  }

  const rows = (data || []) as unknown as PlaylistVideoRow[];
  return rows
    .filter((row) => Boolean(row.video))
    .map((row) => {
      const base = mapVideoRow(row.video as VideoRow);
      const playlist = Array.isArray(row.playlist) ? row.playlist[0] : row.playlist;
      return {
        ...base,
        playlistId: playlist?.id,
        playlistName: playlist?.name,
        playlistSlug: playlist?.slug,
        position: row.position,
      };
    });
}

export async function listPublicVideos(params: VideoQueryParams = {}): Promise<VideoItem[]> {
  const sb = getSupabaseClient();

  if (params.playlistId) {
    return listPlaylistVideos(params.playlistId);
  }

  const limit = params.limit ?? 24;
  const offset = params.offset ?? 0;

  let query = sb
    .schema('public')
    .from('videos')
    .select('id, youtube_id, title, description, channel_name, duration_seconds, thumbnail_url, language, category_id, category:categories(id, name, slug, color)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  if (params.search) {
    const value = params.search.replace(/,/g, ' ');
    query = query.or(`title.ilike.%${value}%,description.ilike.%${value}%,channel_name.ilike.%${value}%,youtube_id.ilike.%${value}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[videoSource] videos: ${error.message}`);
  }

  return (data || []).map((row) => mapVideoRow(row as unknown as VideoRow));
}

export async function getPublicVideoById(videoId: string): Promise<VideoItem | null> {
  const sb = getSupabaseClient();

  const { data, error } = await sb
    .schema('public')
    .from('videos')
    .select('id, youtube_id, title, description, channel_name, duration_seconds, thumbnail_url, language, category_id, category:categories(id, name, slug, color)')
    .eq('id', videoId)
    .maybeSingle();

  if (error) {
    throw new Error(`[videoSource] video detail: ${error.message}`);
  }

  if (!data) return null;

  const video = mapVideoRow(data as unknown as VideoRow);

  const { data: playlistData, error: playlistError } = await sb
    .schema('public')
    .from('playlist_videos')
    .select('position, playlist:playlists!playlist_videos_playlist_id_fkey(id, name, slug)')
    .eq('video_id', videoId)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  const playlist = Array.isArray(playlistData?.playlist)
    ? playlistData?.playlist[0]
    : playlistData?.playlist;

  if (!playlistError && playlist) {
    video.playlistId = playlist.id;
    video.playlistName = playlist.name;
    video.playlistSlug = playlist.slug;
    video.position = playlistData.position;
  }

  return video;
}

export async function listRelatedVideos(currentVideo: VideoItem, limit = 4): Promise<VideoItem[]> {
  const sb = getSupabaseClient();

  let query = sb
    .schema('public')
    .from('videos')
    .select('id, youtube_id, title, description, channel_name, duration_seconds, thumbnail_url, language, category_id, category:categories(id, name, slug, color)')
    .neq('id', currentVideo.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (currentVideo.categoryId) {
    query = query.eq('category_id', currentVideo.categoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[videoSource] related videos: ${error.message}`);
  }

  return (data || []).map((row) => mapVideoRow(row as unknown as VideoRow));
}
