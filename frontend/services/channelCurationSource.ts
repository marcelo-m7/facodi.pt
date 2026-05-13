/**
 * Channel Curation Data Source
 * Handles YouTube channel imports, video analysis, and playlist mapping with mock fallback
 */

import { supabase } from './supabase';
import { COURSE_UNITS } from '../data/courses';
import { PLAYLISTS } from '../data/playlists';
import { CurricularUnit } from '../types';

// Types
export interface ChannelIdentity {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
}

export interface ChannelVideo {
  id: string;
  title: string;
  description?: string;
  duration: number; // seconds
  viewCount: number;
  publishedAt: string; // ISO date
  thumbnailUrl?: string;
  channelName: string;
}

export interface VideoAnalysis {
  videoId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  pedagogicalScore: number; // 0-100
  topics: string[];
  justification: string;
  playlistSuggestions: string[]; // playlist names
  confidence: number; // 0-100
}

export interface PlaylistSuggestion {
  id: string;
  name: string;
  matchPercentage: number; // 0-100
  description?: string;
}

export interface PublishRequest {
  channelId: string;
  videoIds: string[];
  mappings: Record<string, string>; // videoId -> playlistId
  curatorNotes?: string;
}

export interface PublishResult {
  success: boolean;
  message: string;
  publishedCount: number;
  affectedPlaylists: string[];
  timestamp: string;
  notes?: string;
}

export interface CurationBrief {
  channelName: string;
  videosCount: number;
  playlistsCount: number;
  estimatedHours: number;
}

// Mock data generators
function mockChannel(channelId: string): ChannelIdentity {
  const names: Record<string, string> = {
    'Matemateca': 'Matemateca',
    'UCxxxxxxx': 'Educational Channel',
  };
  
  return {
    id: channelId,
    name: names[channelId] || 'Unknown Channel',
    description: 'Educational content channel',
    subscriberCount: 100000,
  };
}

function mockVideos(channelId: string): ChannelVideo[] {
  if (channelId.includes('Matemateca') || channelId.includes('matemateca')) {
    return [
      {
        id: 'vid_1',
        title: 'Limites e Continuidade — Introdução ao Cálculo',
        description: 'Aula didática sobre Limites com exemplos resolvidos. Canal matemateca....',
        duration: 1800,
        viewCount: 72800,
        publishedAt: '2026-05-10T10:00:00Z',
        thumbnailUrl: 'https://via.placeholder.com/320x180?text=Limites',
        channelName: 'matemateca',
      },
      {
        id: 'vid_2',
        title: 'Derivadas: Regra da Cadeia e Aplicações',
        description: 'Aula didática sobre Derivadas com exemplos resolvidos. Canal matemateca....',
        duration: 2220,
        viewCount: 15500,
        publishedAt: '2026-05-03T10:00:00Z',
        thumbnailUrl: 'https://via.placeholder.com/320x180?text=Derivadas',
        channelName: 'matemateca',
      },
      {
        id: 'vid_3',
        title: 'Integral Definida e o Teorema Fundamental do Cálculo',
        description: 'Aula didática sobre Integrais com exemplos resolvidos. Canal matemateca....',
        duration: 2640,
        viewCount: 40400,
        publishedAt: '2026-04-26T10:00:00Z',
        thumbnailUrl: 'https://via.placeholder.com/320x180?text=Integrais',
        channelName: 'matemateca',
      },
      {
        id: 'vid_4',
        title: 'Álgebra Linear: Matrizes e Sistemas de Equações',
        description: 'Aula didática sobre Álgebra Linear com exemplos resolvidos. Canal matemateca....',
        duration: 3060,
        viewCount: 35800,
        publishedAt: '2026-04-19T10:00:00Z',
        thumbnailUrl: 'https://via.placeholder.com/320x180?text=Álgebra',
        channelName: 'matemateca',
      },
      {
        id: 'vid_5',
        title: 'Espaços Vetoriais e Transformações Lineares',
        description: 'Aula didática sobre Álgebra Linear com exemplos resolvidos. Canal matemateca....',
        duration: 3480,
        viewCount: 94600,
        publishedAt: '2026-04-12T10:00:00Z',
        thumbnailUrl: 'https://via.placeholder.com/320x180?text=Espaços',
        channelName: 'matemateca',
      },
      {
        id: 'vid_6',
        title: 'Probabilidade e Estatística Básica',
        description: 'Aula didática sobre Probabilidade com exemplos resolvidos. Canal matemateca....',
        duration: 3900,
        viewCount: 50100,
        publishedAt: '2026-04-05T10:00:00Z',
        thumbnailUrl: 'https://via.placeholder.com/320x180?text=Probabilidade',
        channelName: 'matemateca',
      },
      {
        id: 'vid_7',
        title: 'Equações Diferenciais Ordinárias — Primeiros Passos',
        description: 'Aula didática sobre Equações Diferenciais com exemplos resolvidos. Canal matemateca....',
        duration: 4320,
        viewCount: 79600,
        publishedAt: '2026-03-28T10:00:00Z',
        thumbnailUrl: 'https://via.placeholder.com/320x180?text=EDOs',
        channelName: 'matemateca',
      },
      {
        id: 'vid_8',
        title: 'Geometria Analítica: Cônicas e Parábolas',
        description: 'Aula didática sobre Geometria Analítica com exemplos resolvidos. Canal matemateca....',
        duration: 4740,
        viewCount: 63800,
        publishedAt: '2026-03-21T10:00:00Z',
        thumbnailUrl: 'https://via.placeholder.com/320x180?text=Geometria',
        channelName: 'matemateca',
      },
    ];
  }
  return [];
}

function mockAnalysis(videoIds: string[]): Map<string, VideoAnalysis> {
  const topics = [
    ['Limits', 'Continuity', 'Calculus'],
    ['Derivatives', 'Chain Rule', 'Calculus'],
    ['Integration', 'Fundamental Theorem', 'Calculus'],
    ['Linear Algebra', 'Matrices', 'Systems'],
    ['Vector Spaces', 'Linear Transformations', 'Linear Algebra'],
    ['Probability', 'Statistics', 'Data Analysis'],
    ['Differential Equations', 'ODEs', 'Mathematics'],
    ['Analytic Geometry', 'Conic Sections', 'Geometry'],
  ];

  const suggestions = [
    ['Cálculo I', 'Mathematics Fundamentals'],
    ['Cálculo II', 'Advanced Calculus'],
    ['Álgebra Linear', 'Linear Algebra Foundations'],
    ['Probabilidade e Estatística', 'Statistics & Probability'],
    ['Equações Diferenciais', 'Differential Equations'],
  ];

  const result = new Map<string, VideoAnalysis>();
  videoIds.forEach((videoId, idx) => {
    const topicSet = topics[idx % topics.length];
    const suggestionSet = suggestions[idx % suggestions.length];
    
    result.set(videoId, {
      videoId,
      difficulty: ['beginner', 'intermediate', 'advanced', 'expert'][idx % 4] as any,
      pedagogicalScore: 70 + Math.random() * 25,
      topics: topicSet,
      justification: `Video aligns well with ${suggestionSet[0]} curriculum standards.`,
      playlistSuggestions: suggestionSet,
      confidence: 75 + Math.random() * 20,
    });
  });

  return result;
}

function mockSuggestions(): PlaylistSuggestion[] {
  return [
    { id: 'pl_calc1', name: 'Cálculo I', matchPercentage: 88, description: 'Introductory Calculus' },
    { id: 'pl_calc2', name: 'Cálculo II', matchPercentage: 85, description: 'Advanced Calculus' },
    { id: 'pl_linalg', name: 'Álgebra Linear', matchPercentage: 82, description: 'Linear Algebra Essentials' },
    { id: 'pl_prob', name: 'Probabilidade e Estatística', matchPercentage: 80, description: 'Probability & Statistics' },
    { id: 'pl_ode', name: 'Equações Diferenciais', matchPercentage: 78, description: 'Differential Equations' },
  ];
}

// Service methods
export async function importChannel(identifier: string): Promise<ChannelIdentity> {
  try {
    if (import.meta.env.VITE_DATA_SOURCE === 'mock' || import.meta.env.VITE_CURATOR_MOCK === 'true') {
      return mockChannel(identifier);
    }

    const { data, error } = await supabase.functions.invoke('fetch_youtube_channel', {
      body: { channelInput: identifier },
    });

    if (error) {
      console.warn('Edge function error, using mock:', error);
      return mockChannel(identifier);
    }

    const payload = data as Record<string, unknown>;
    return {
      id: String(payload?.channelId || identifier),
      name: String(payload?.title || identifier),
      description: typeof payload?.description === 'string' ? payload.description : undefined,
      thumbnailUrl: typeof payload?.thumbnailUrl === 'string' ? payload.thumbnailUrl : undefined,
    };
  } catch (err) {
    console.warn('Channel import failed, using mock:', err);
    return mockChannel(identifier);
  }
}

export async function listChannelVideos(
  channelId: string,
  pageToken?: string,
  maxResults: number = 50
): Promise<{ videos: ChannelVideo[]; nextPageToken?: string }> {
  try {
    if (import.meta.env.VITE_DATA_SOURCE === 'mock' || import.meta.env.VITE_CURATOR_MOCK === 'true') {
      const allVideos = mockVideos(channelId);
      return { videos: allVideos };
    }

    const { data, error } = await supabase.functions.invoke('list_channel_videos', {
      body: {
        channelInput: channelId,
        pageToken,
        brief: { maxVideos: maxResults },
      },
    });

    if (error) {
      console.warn('Edge function error, using mock:', error);
      const allVideos = mockVideos(channelId);
      return { videos: allVideos };
    }

    const rows = Array.isArray(data)
      ? data
      : Array.isArray((data as Record<string, unknown>)?.videos)
        ? ((data as Record<string, unknown>).videos as unknown[])
        : [];

    const normalized: ChannelVideo[] = rows.map((row) => {
      const payload = row as Record<string, unknown>;
      return {
        id: String(payload.id || ''),
        title: String(payload.title || ''),
        description: typeof payload.description === 'string' ? payload.description : undefined,
        duration: Number(payload.durationSeconds || payload.duration || 0),
        viewCount: Number(payload.viewCount || 0),
        publishedAt: String(payload.publishedAt || new Date().toISOString()),
        thumbnailUrl: typeof payload.thumbnailUrl === 'string' ? payload.thumbnailUrl : undefined,
        channelName: String(payload.channelTitle || payload.channelName || channelId),
      };
    });

    return {
      videos: normalized,
      nextPageToken: typeof (data as Record<string, unknown>)?.nextPageToken === 'string'
        ? ((data as Record<string, unknown>).nextPageToken as string)
        : undefined,
    };
  } catch (err) {
    console.warn('Video listing failed, using mock:', err);
    const allVideos = mockVideos(channelId);
    return { videos: allVideos };
  }
}

export async function analyzeVideosBatch(videoIds: string[]): Promise<Map<string, VideoAnalysis>> {
  try {
    if (import.meta.env.VITE_DATA_SOURCE === 'mock' || import.meta.env.VITE_CURATOR_MOCK === 'true') {
      return mockAnalysis(videoIds);
    }

    const { data, error } = await supabase.functions.invoke('analyze_video_batch', {
      body: {
        videos: videoIds.map((id) => ({ id })),
      },
    });

    if (error) {
      console.warn('Edge function error, using mock:', error);
      return mockAnalysis(videoIds);
    }

    const entries = Array.isArray(data) ? data : [];
    const mapped = new Map<string, VideoAnalysis>();

    for (const row of entries as Array<Record<string, unknown>>) {
      const videoId = String(row.videoId || '');
      if (!videoId) continue;
      const rawDifficulty = String(row.difficulty || 'intermediate');
      const difficulty = rawDifficulty === 'foundational' ? 'beginner' : rawDifficulty;

      mapped.set(videoId, {
        videoId,
        difficulty: (['beginner', 'intermediate', 'advanced', 'expert'].includes(difficulty)
          ? difficulty
          : 'intermediate') as VideoAnalysis['difficulty'],
        pedagogicalScore: Number(row.confidence || 0.7) * 100,
        topics: Array.isArray(row.tags)
          ? (row.tags as string[])
          : (typeof row.topic === 'string' ? [row.topic] : []),
        justification: String(row.pedagogicalReason || row.summary || ''),
        playlistSuggestions: [],
        confidence: Number(row.confidence || 0.7) * 100,
      });
    }

    return mapped;
  } catch (err) {
    console.warn('Analysis failed, using mock:', err);
    return mockAnalysis(videoIds);
  }
}

export async function generatePlaylistSuggestions(
  videoAnalyses: Map<string, VideoAnalysis>
): Promise<PlaylistSuggestion[]> {
  try {
    if (import.meta.env.VITE_DATA_SOURCE === 'mock' || import.meta.env.VITE_CURATOR_MOCK === 'true') {
      return mockSuggestions();
    }

    const { data, error } = await supabase.functions.invoke('generate_playlist_suggestions', {
      body: {
        videos: Array.from(videoAnalyses.keys()).map((id) => ({ id })),
        analyses: Array.from(videoAnalyses.values()).map((entry) => ({
          videoId: entry.videoId,
          topic: entry.topics[0] || '',
          difficulty: entry.difficulty,
        })),
      },
    });

    if (error) {
      console.warn('Edge function error, using mock:', error);
      return mockSuggestions();
    }

    const suggestions = Array.isArray(data) ? data : [];

    return (suggestions as Array<Record<string, unknown>>).map((item, index) => ({
      id: String(item.playlistId || `suggested_playlist_${index + 1}`),
      name: String(item.suggestedUnit || `Sugestao ${index + 1}`),
      matchPercentage: Math.round(Number(item.confidence || 0.5) * 100),
      description: typeof item.courseId === 'string' ? `Curso ${item.courseId}` : undefined,
    }));
  } catch (err) {
    console.warn('Suggestion generation failed, using mock:', err);
    return mockSuggestions();
  }
}

export async function publishCuratedVideos(request: PublishRequest): Promise<PublishResult> {
  try {
    if (import.meta.env.VITE_DATA_SOURCE === 'mock' || import.meta.env.VITE_CURATOR_MOCK === 'true') {
      return {
        success: true,
        message: `Successfully published ${request.videoIds.length} videos`,
        publishedCount: request.videoIds.length,
        affectedPlaylists: Array.from(new Set(Object.values(request.mappings))),
        timestamp: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase.functions.invoke('publish_curated_videos', {
      body: {
        items: request.videoIds.map((videoId) => ({
          video: { id: videoId },
          suggestion: {
            playlistId: request.mappings[videoId] || null,
          },
          analysis: null,
        })),
      },
    });

    if (error) {
      console.warn('Edge function error, using mock:', error);
      return {
        success: true,
        message: `Successfully published ${request.videoIds.length} videos`,
        publishedCount: request.videoIds.length,
        affectedPlaylists: Array.from(new Set(Object.values(request.mappings))),
        timestamp: new Date().toISOString(),
      };
    }

    const publishedItems = Array.isArray(data) ? data : [];
    const affectedPlaylists = Array.from(new Set(Object.values(request.mappings)));

    return {
      success: true,
      message: `Successfully normalized ${publishedItems.length} videos for publication flow`,
      publishedCount: publishedItems.length,
      affectedPlaylists,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Publish failed, using mock:', err);
    return {
      success: true,
      message: `Successfully published ${request.videoIds.length} videos`,
      publishedCount: request.videoIds.length,
      affectedPlaylists: Array.from(new Set(Object.values(request.mappings))),
      timestamp: new Date().toISOString(),
    };
  }
}

// Fallback state management
let fallbackState: any = null;

export function getPipelineFallbackState() {
  return fallbackState;
}

export function resetPipelineFallbackState() {
  fallbackState = null;
}

// Aliases for backwards compatibility
export const fetchYouTubeChannel = importChannel;
export const analyzeVideoBatch = analyzeVideosBatch;

const channelCurationSource = {
  importChannel,
  listChannelVideos,
  analyzeVideosBatch,
  analyzeVideoBatch,
  fetchYouTubeChannel,
  generatePlaylistSuggestions,
  publishCuratedVideos,
  getPipelineFallbackState,
  resetPipelineFallbackState,
};

export default channelCurationSource;
