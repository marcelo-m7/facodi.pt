import { supabase } from './supabase';
import { submitContent } from './contentSubmissionSource';

export function parseYouTubeVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '') || null;
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      if (parsedUrl.pathname === '/watch') {
        return parsedUrl.searchParams.get('v');
      }

      if (parsedUrl.pathname.startsWith('/shorts/')) {
        return parsedUrl.pathname.split('/shorts/')[1]?.split('/')[0] || null;
      }

      if (parsedUrl.pathname.startsWith('/embed/')) {
        return parsedUrl.pathname.split('/embed/')[1]?.split('/')[0] || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export type VideoSuggestionResult = {
  duplicate: boolean;
  status?: 'pending' | 'approved' | 'rejected' | string;
  message?: string;
  suggestion?: {
    id: string;
    status: string;
    created_at: string;
  };
  video?: {
    videoId: string;
    title: string;
    description: string;
    channelTitle: string;
    thumbnailUrl: string;
    tags: string[];
    duration: string | null;
    durationSeconds: number | null;
  };
  match?: {
    course: { id: string; code: string; title: string } | null;
    unit: { id: string; code: string; unitCode: string | null; name: string; sectionName: string | null } | null;
    playlist: { id: string; name: string; description: string | null; courseCode: string | null; unitCode: string | null } | null;
    topic: string | null;
    confidence: number;
  };
};

export async function suggestYouTubeVideo(url: string): Promise<VideoSuggestionResult> {
  const videoId = parseYouTubeVideoId(url);
  if (!videoId) {
    throw new Error('URL de YouTube invalida.');
  }

  const { data: existing, error: existingError } = await (supabase as any)
    .from('content_submissions')
    .select('id, status, created_at')
    .or(`url.eq.${url},youtube_video_id.eq.${videoId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message || 'Falha ao verificar sugestoes existentes.');
  }

  if (existing) {
    return {
      duplicate: true,
      status: existing.status,
      message: 'Video ja sugerido anteriormente.',
      suggestion: {
        id: existing.id,
        status: existing.status,
        created_at: existing.created_at,
      },
      video: {
        videoId,
        title: `YouTube Video ${videoId}`,
        description: '',
        channelTitle: '',
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        tags: [],
        duration: null,
        durationSeconds: null,
      },
      match: {
        course: null,
        unit: null,
        playlist: null,
        topic: null,
        confidence: 0,
      },
    };
  }

  await submitContent({
    content_type: 'video',
    url,
    youtube_video_id: videoId,
    suggested_title: `YouTube Video ${videoId}`,
    summary: 'Sugestao enviada pelo painel do editor.',
    tags: ['youtube', 'suggested'],
  });

  return {
    duplicate: false,
    status: 'pending',
    message: 'Sugestao enviada para revisao.',
    video: {
      videoId,
      title: `YouTube Video ${videoId}`,
      description: '',
      channelTitle: '',
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      tags: [],
      duration: null,
      durationSeconds: null,
    },
    match: {
      course: null,
      unit: null,
      playlist: null,
      topic: null,
      confidence: 0,
    },
  };
}
