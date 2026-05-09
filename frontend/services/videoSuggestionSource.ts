import { supabase } from './supabase';

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
  const { data, error } = await supabase.functions.invoke('suggest-youtube-video', {
    body: { url },
  });

  if (error) {
    throw new Error(error.message || 'Falha ao enviar sugestao de video.');
  }

  return data as VideoSuggestionResult;
}
