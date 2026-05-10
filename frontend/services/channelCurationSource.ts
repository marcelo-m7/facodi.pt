import { supabase } from './supabase';
import { COURSE_UNITS } from '../data/courses';
import { PLAYLISTS } from '../data/playlists';
import { CurricularUnit } from '../types';

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
  isFallback?: boolean;
}

export interface PlaylistSuggestion {
  videoId: string;
  courseId?: string;
  unitId?: string;
  playlistId?: string;
  confidence: number;
  isFallback?: boolean;
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

const EDUCATIONAL_KEYWORDS = {
  foundational: [
    'intro',
    'iniciacao',
    'basico',
    'fundamental',
    'primeiros passos',
    'para iniciantes',
    'comeco',
    'essencial',
    'introducao',
  ],
  intermediate: [
    'intermedio',
    'intermediate',
    'medio',
    'desenvolvimento',
    'aprofundamento',
    'tecnicas',
    'pratica',
    'projeto',
    'workflow',
    'processo',
  ],
  advanced: [
    'avancado',
    'advanced',
    'complexo',
    'otimizacao',
    'producao',
    'professional',
    'master',
    'especializado',
    'performance',
  ],
  expert: ['especialista', 'expert', 'mastery', 'dominio', 'investigacao', 'pesquisa'],
};

const TOPIC_KEYWORDS = {
  design: ['design', 'visual', 'grafico', 'interface', 'ux', 'ui', 'branding', 'tipografia', 'comunicacao'],
  drawing: ['desenho', 'drawing', 'sketch', 'illustration', 'arte', 'composicao', 'ilustracao'],
  photography: ['fotografia', 'photography', 'light', 'camera', 'imagem', 'fotografico', 'foto'],
  video: ['video', 'cinema', 'producao', 'filmagem', 'edicao', 'motion', 'animacao', 'filme'],
  audio: ['audio', 'som', 'music', 'podcast', 'voz', 'sound design', 'musica'],
  web: ['web', 'html', 'css', 'javascript', 'site', 'wordpress', 'desarrollo web', 'frontend', 'backend'],
  marketing: ['marketing', 'social media', 'seo', 'publicidade', 'branding', 'campanha', 'redes sociais'],
  business: ['negocio', 'empreendedorismo', 'business', 'startup', 'gestao', 'vendas', 'empreendimento'],
};

const inferDifficulty = (text: string): VideoAnalysis['difficulty'] => {
  const lower = text.toLowerCase();
  for (const level of ['expert', 'advanced', 'intermediate', 'foundational'] as const) {
    if (EDUCATIONAL_KEYWORDS[level].some((keyword) => lower.includes(keyword))) {
      return level;
    }
  }
  return 'intermediate';
};

const inferTopic = (text: string): string => {
  const lower = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return topic;
    }
  }
  const words = lower.split(/[\s\-_]+/).filter((w) => w.length > 3);
  return words[0] || 'conteudo';
};

const fallbackAnalyses = (videos: ChannelVideo[]): VideoAnalysis[] => {
  return videos.map((video) => {
    const title = String(video.title || '');
    const description = String(video.description || '');
    const combined = `${title}. ${description}`.substring(0, 300);
    const topic = inferTopic(title);
    const difficulty = inferDifficulty(title);

    return {
      videoId: String(video.id || ''),
      summary: combined || 'Vídeo coletado para curação educacional.',
      pedagogicalReason: `Conteúdo sobre ${topic} em nível ${difficulty}. Potencial para integração em trilhas de aprendizagem aberta.`,
      topic,
      difficulty,
      tags: ['facodi', 'youtube', topic].filter((t) => t),
      isFallback: true,
    };
  });
};

const matchTopicToUnit = (topic: string): CurricularUnit | undefined => {
  if (!topic || COURSE_UNITS.length === 0) return undefined;

  const topicLower = topic.toLowerCase();
  let bestMatch: { unit: CurricularUnit; score: number } | undefined;

  for (const unit of COURSE_UNITS) {
    const unitNameLower = (unit.name || '').toLowerCase();
    const unitDescLower = (unit.description || '').toLowerCase();
    const combined = `${unitNameLower} ${unitDescLower}`;

    let score = 0;
    if (unitNameLower.includes(topicLower)) score += 2;
    if (combined.includes(topicLower)) score += 1;

    // Also check if unit tags include the topic
    const unitTags = (unit.tags || []).map((t) => t.toLowerCase());
    if (unitTags.some((tag) => tag.includes(topicLower) || topicLower.includes(tag))) {
      score += 1.5;
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { unit, score };
    }
  }

  return bestMatch?.unit;
};

const fallbackSuggestions = (
  videos: ChannelVideo[],
  analyses: VideoAnalysis[],
): PlaylistSuggestion[] => {
  const hasCatalog = COURSE_UNITS.length > 0;

  return videos.map((video, index) => {
    const analysis = analyses.find((item) => item.videoId === video.id);
    const unit = analysis ? matchTopicToUnit(analysis.topic) : undefined;

    // Fallback to round-robin if no topic match
    const finalUnit = unit || (hasCatalog ? COURSE_UNITS[index % COURSE_UNITS.length] : undefined);

    const playlist = finalUnit
      ? PLAYLISTS.find(
          (item) => item.unit_code === finalUnit.id || item.units.includes(finalUnit.id),
        )
      : undefined;

    return {
      videoId: video.id,
      courseId: finalUnit?.courseId,
      unitId: finalUnit?.id,
      playlistId: playlist?.id,
      confidence: analysis ? 0.72 : 0.4,
      isFallback: true,
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
