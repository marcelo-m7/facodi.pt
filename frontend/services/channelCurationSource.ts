import { supabase } from './supabase';

export interface ChannelIdentity {
  channelId: string;
  title: string;
  description?: string;
  customUrl?: string;
  thumbnailUrl?: string;
}

export interface ChannelVideo {
  id: string;
  title: string;
  description?: string;
  publishedAt?: string;
  durationSeconds?: number;
  channelTitle?: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface CurationBrief {
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  includeShorts?: boolean;
  language?: string;
  maxVideos?: number;
}

export interface VideoAnalysis {
  videoId: string;
  summary: string;
  pedagogicalReason: string;
  topic: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
}

export interface PlaylistSuggestion {
  videoId: string;
  courseId?: string;
  unitId?: string;
  playlistId?: string;
  confidence: number;
}

export interface PublishPayloadItem {
  video: ChannelVideo;
  analysis?: VideoAnalysis;
  suggestion?: PlaylistSuggestion;
}

export interface PipelineFallbackState {
  used: boolean;
  stages: string[];
}

const INVOKE_TIMEOUT_MS = 15_000;
const INVOKE_MAX_RETRIES = 2;
const INVOKE_BACKOFF_BASE_MS = 400;

const fallbackState: PipelineFallbackState = {
  used: false,
  stages: [],
};

const markFallbackUsage = (stage: string): void => {
  fallbackState.used = true;
  if (!fallbackState.stages.includes(stage)) {
    fallbackState.stages.push(stage);
  }
};

export const resetPipelineFallbackState = (): void => {
  fallbackState.used = false;
  fallbackState.stages = [];
};

export const getPipelineFallbackState = (): PipelineFallbackState => ({
  used: fallbackState.used,
  stages: [...fallbackState.stages],
});

const shouldUseLocalFallback = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to send a request to the edge function') ||
    normalized.includes('fetch') ||
    normalized.includes('network') ||
    normalized.includes('cors') ||
    normalized.includes('timeout')
  );
};

const shouldRetryInvoke = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to send a request to the edge function') ||
    normalized.includes('fetch') ||
    normalized.includes('network') ||
    normalized.includes('timeout')
  );
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, functionName: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`edge_function_timeout:${functionName}`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const normalizeChannelInput = (channelInput: string): string => {
  const trimmed = channelInput.trim();
  if (!trimmed) return '';
  return trimmed;
};

const fallbackChannelIdentity = (channelInput: string): ChannelIdentity => {
  const normalized = normalizeChannelInput(channelInput);
  const titleFromHandle = normalized.includes('@')
    ? normalized.slice(normalized.lastIndexOf('@') + 1)
    : 'canal-youtube';

  const channelId = normalized.startsWith('UC')
    ? normalized
    : `channel_${titleFromHandle.toLowerCase().replace(/[^a-z0-9_-]/gi, '')}`;

  return {
    channelId,
    title: titleFromHandle,
    description: 'Canal validado em fallback local.',
    customUrl: normalized,
    thumbnailUrl: '',
  };
};

const fallbackChannelVideos = (channelInput: string, brief: CurationBrief): ChannelVideo[] => {
  const maxVideos = Number(brief.maxVideos || 10);
  const count = Math.max(1, Math.min(maxVideos, 30));
  const now = new Date().toISOString();

  return Array.from({ length: count }).map((_, index) => ({
    id: `mock_video_${index + 1}`,
    title: `Video ${index + 1} do canal ${channelInput}`,
    description: 'Conteudo coletado em fallback local para testes de pipeline.',
    publishedAt: now,
    durationSeconds: 900 + index * 60,
    channelTitle: channelInput,
    thumbnailUrl: '',
    tags: ['facodi', 'youtube', 'pipeline'],
  }));
};

const inferDifficulty = (text: string): VideoAnalysis['difficulty'] => {
  const lower = text.toLowerCase();
  if (lower.includes('introducao') || lower.includes('basico') || lower.includes('basic')) return 'foundational';
  if (lower.includes('avancado') || lower.includes('advanced')) return 'advanced';
  if (lower.includes('especialista') || lower.includes('expert')) return 'expert';
  return 'intermediate';
};

const fallbackAnalyses = (videos: ChannelVideo[]): VideoAnalysis[] => {
  return videos.map((video) => ({
    videoId: String(video.id || ''),
    summary: `Resumo pedagogico automatico para ${video.title}.`,
    pedagogicalReason: 'Conteudo com potencial de apoio em trilhas de aprendizagem aberta.',
    topic: video.title.split('-')[0]?.trim() || 'topico geral',
    difficulty: inferDifficulty(video.title || ''),
    tags: ['facodi', 'curadoria', 'youtube'],
  }));
};

const fallbackSuggestions = (
  videos: ChannelVideo[],
  analyses: VideoAnalysis[],
): PlaylistSuggestion[] => {
  return videos.map((video) => {
    const hasAnalysis = analyses.some((item) => item.videoId === video.id);
    return {
      videoId: video.id,
      courseId: undefined,
      unitId: undefined,
      playlistId: undefined,
      confidence: hasAnalysis ? 0.72 : 0.4,
    };
  });
};

const fallbackPublishPayload = (items: PublishPayloadItem[]): PublishPayloadItem[] => {
  return items.map((item) => ({
    video: item.video,
    analysis: item.analysis || undefined,
    suggestion: item.suggestion || undefined,
  }));
};

const invoke = async <T>(functionName: string, body: Record<string, unknown>): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= INVOKE_MAX_RETRIES; attempt += 1) {
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke(functionName, { body }),
        INVOKE_TIMEOUT_MS,
        functionName,
      );

      if (error) {
        throw new Error(error.message || `edge_function_error:${functionName}`);
      }

      return data as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error';
      lastError = error instanceof Error ? error : new Error(message);

      if (attempt >= INVOKE_MAX_RETRIES || !shouldRetryInvoke(message)) {
        break;
      }

      const backoffMs = INVOKE_BACKOFF_BASE_MS * 2 ** attempt;
      await wait(backoffMs);
    }
  }

  throw (lastError ?? new Error(`edge_function_error:${functionName}`));
};

export const fetchYouTubeChannel = async (channelInput: string): Promise<ChannelIdentity> => {
  try {
    return await invoke<ChannelIdentity>('fetch_youtube_channel', { channelInput });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (shouldUseLocalFallback(message)) {
      markFallbackUsage('fetch_youtube_channel');
      return fallbackChannelIdentity(channelInput);
    }
    throw error;
  }
};

export const listChannelVideos = async (
  channelInput: string,
  brief: CurationBrief,
): Promise<ChannelVideo[]> => {
  try {
    return await invoke<ChannelVideo[]>('list_channel_videos', { channelInput, brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (shouldUseLocalFallback(message)) {
      markFallbackUsage('list_channel_videos');
      return fallbackChannelVideos(channelInput, brief);
    }
    throw error;
  }
};

export const analyzeVideoBatch = async (
  channel: ChannelIdentity,
  videos: ChannelVideo[],
  brief: CurationBrief,
): Promise<VideoAnalysis[]> => {
  try {
    return await invoke<VideoAnalysis[]>('analyze_video_batch', { channel, videos, brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (shouldUseLocalFallback(message)) {
      markFallbackUsage('analyze_video_batch');
      return fallbackAnalyses(videos);
    }
    throw error;
  }
};

export const generatePlaylistSuggestions = async (
  channel: ChannelIdentity,
  videos: ChannelVideo[],
  analyses: VideoAnalysis[],
): Promise<PlaylistSuggestion[]> => {
  try {
    return await invoke<PlaylistSuggestion[]>('generate_playlist_suggestions', {
      channel,
      videos,
      analyses,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (shouldUseLocalFallback(message)) {
      markFallbackUsage('generate_playlist_suggestions');
      return fallbackSuggestions(videos, analyses);
    }
    throw error;
  }
};

export const publishCuratedVideos = async (items: PublishPayloadItem[]): Promise<PublishPayloadItem[]> => {
  try {
    return await invoke<PublishPayloadItem[]>('publish_curated_videos', { items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (shouldUseLocalFallback(message)) {
      markFallbackUsage('publish_curated_videos');
      return fallbackPublishPayload(items);
    }
    throw error;
  }
};
