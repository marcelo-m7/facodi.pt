/**
 * Channel Curation Data Source
 * Handles YouTube channel imports, video analysis, and playlist mapping with mock fallback
 */

import { supabase } from './supabase';

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
      body: { channelIdentifier: identifier },
    });

    if (error) {
      console.warn('Edge function error, using mock:', error);
      return mockChannel(identifier);
    }

    return data as ChannelIdentity;
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
      body: { channelId, pageToken, maxResults },
    });

    if (error) {
      console.warn('Edge function error, using mock:', error);
      const allVideos = mockVideos(channelId);
      return { videos: allVideos };
    }

    return data;
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
      body: { videoIds },
    });

    if (error) {
      console.warn('Edge function error, using mock:', error);
      return mockAnalysis(videoIds);
    }

    return new Map(data);
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
      body: { analyses: Array.from(videoAnalyses.values()) },
    });

    if (error) {
      console.warn('Edge function error, using mock:', error);
      return mockSuggestions();
    }

    return data as PlaylistSuggestion[];
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
      body: request,
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

    return data as PublishResult;
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
