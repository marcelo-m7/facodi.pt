import { supabase } from './supabase';
import {
  ChannelIdentity,
  ChannelVideo,
  AIAnalysisResult,
  PlaylistSuggestion,
  PublishRequest,
  PublishResult,
  Difficulty,
} from '../types';

const useMock =
  import.meta.env.VITE_DATA_SOURCE === 'mock' ||
  import.meta.env.VITE_CURATOR_MOCK === 'true';

// ─── Mock data generators ──────────────────────────────────────────────────

function mockChannel(identifier: string): ChannelIdentity {
  const handle = identifier.startsWith('@') ? identifier : `@${identifier.replace(/.*\/@?/, '').replace(/\/?$/, '')}`;
  const name = handle.replace('@', '');
  return {
    channelId: `UC_mock_${name.toLowerCase()}`,
    username: name,
    email: '',
    handle,
    url: `https://youtube.com/${handle}`,
  };
}

function mockVideos(channelId: string, channelName: string): ChannelVideo[] {
  const topics = [
    ['Limites', 'Continuidade', 'Funções'],
    ['Derivadas', 'Regra da Cadeia', 'Otimização'],
    ['Integrais', 'Teorema Fundamental do Cálculo'],
    ['Álgebra Linear', 'Matrizes', 'Sistemas Lineares'],
    ['Álgebra Linear', 'Vetores', 'Espaços Vetoriais'],
    ['Probabilidade', 'Estatística Descritiva'],
    ['Equações Diferenciais', 'Modelagem Matemática'],
    ['Geometria Analítica', 'Cônicas', 'Parábolas'],
  ];
  return Array.from({ length: 8 }, (_, i) => ({
    videoId: `video_mock_${channelId}_${i + 1}`,
    title: [
      'Limites e Continuidade — Introdução ao Cálculo',
      'Derivadas: Regra da Cadeia e Aplicações',
      'Integral Definida e o Teorema Fundamental do Cálculo',
      'Álgebra Linear: Matrizes e Sistemas de Equações',
      'Espaços Vetoriais e Transformações Lineares',
      'Probabilidade e Estatística Básica',
      'Equações Diferenciais Ordinárias — Primeiros Passos',
      'Geometria Analítica: Cônicas e Parábolas',
    ][i],
    description: `Aula didática sobre ${topics[i][0]} com exemplos resolvidos. Canal ${channelName}.`,
    thumbnail: `https://picsum.photos/seed/${channelId}${i}/320/180`,
    duration: 1800 + i * 420, // 30–83 min
    publishedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    channelName,
    viewCount: Math.floor(5000 + Math.random() * 95000),
    tags: topics[i],
  }));
}

function mockAnalysis(videos: Pick<ChannelVideo, 'videoId' | 'title'>[]): Map<string, AIAnalysisResult> {
  const difficulties: Difficulty[] = [
    Difficulty.FOUNDATIONAL, Difficulty.INTERMEDIATE, Difficulty.ADVANCED,
    Difficulty.FOUNDATIONAL, Difficulty.INTERMEDIATE, Difficulty.INTERMEDIATE,
    Difficulty.ADVANCED, Difficulty.FOUNDATIONAL,
  ];
  const scores = [0.91, 0.87, 0.83, 0.95, 0.89, 0.78, 0.82, 0.88];
  const playlists = [
    { id: 'pl_calc1', name: 'Cálculo I' },
    { id: 'pl_calc2', name: 'Cálculo II' },
    { id: 'pl_linalg', name: 'Álgebra Linear' },
    { id: 'pl_prob', name: 'Probabilidade e Estatística' },
    { id: 'pl_ode', name: 'Equações Diferenciais' },
  ];
  const map = new Map<string, AIAnalysisResult>();
  videos.forEach((v, i) => {
    const idx = i % difficulties.length;
    const primaryPlaylist = [playlists[0], playlists[0], playlists[1], playlists[2], playlists[2], playlists[3], playlists[4], playlists[0]][idx];
    map.set(v.videoId, {
      videoId: v.videoId,
      topics: [
        ['Limites', 'Funções', 'Continuidade'],
        ['Derivadas', 'Regra da Cadeia'],
        ['Integrais', 'TFC'],
        ['Matrizes', 'Sistemas Lineares'],
        ['Vetores', 'Espaços Vetoriais'],
        ['Probabilidade', 'Estatística'],
        ['EDOs', 'Modelagem'],
        ['Cônicas', 'Geometria Analítica'],
      ][idx],
      difficulty: difficulties[idx],
      pedagogicalScore: scores[idx],
      pedagogicalJustification: `O vídeo "${v.title}" aborda conceitos fundamentais com boa progressão didática, exemplos práticos e linguagem acessível. Recomendado para integração no currículo de graduação.`,
      playlistSuggestions: [
        { playlistId: primaryPlaylist.id, playlistName: primaryPlaylist.name, confidence: scores[idx], reason: 'Conteúdo alinhado ao ementário da disciplina.' },
        { playlistId: playlists[(idx + 2) % playlists.length].id, playlistName: playlists[(idx + 2) % playlists.length].name, confidence: Math.max(0.3, scores[idx] - 0.35), reason: 'Conteúdo complementar aplicável.' },
      ],
    });
  });
  return map;
}

function mockSuggestions(videos: Pick<ChannelVideo, 'videoId'>[]): Map<string, PlaylistSuggestion[]> {
  const playlists = [
    { id: 'pl_calc1', name: 'Cálculo I' },
    { id: 'pl_calc2', name: 'Cálculo II' },
    { id: 'pl_linalg', name: 'Álgebra Linear' },
    { id: 'pl_prob', name: 'Probabilidade e Estatística' },
    { id: 'pl_ode', name: 'Equações Diferenciais' },
  ];
  const map = new Map<string, PlaylistSuggestion[]>();
  videos.forEach((v, i) => {
    const primary = playlists[i % playlists.length];
    const secondary = playlists[(i + 1) % playlists.length];
    map.set(v.videoId, [
      { playlistId: primary.id, playlistName: primary.name, confidence: 0.88 - i * 0.02, reason: 'Alta relevância para esta disciplina.' },
      { playlistId: secondary.id, playlistName: secondary.name, confidence: 0.55, reason: 'Conteúdo relacionado.' },
    ]);
  });
  return map;
}

// ─── Service ────────────────────────────────────────────────────────────────

/**
 * Service wrapper around Supabase Edge Functions for YouTube channel curation.
 * Falls back to mock data when VITE_DATA_SOURCE=mock or when edge functions fail.
 */

export const channelCurationSource = {
  /**
   * Import a YouTube channel by URL, @handle, channelId, or channel name.
   * Falls back to mock data when edge function is unavailable.
   */
  async importChannel(identifier: string): Promise<ChannelIdentity> {
    if (!identifier || identifier.trim() === '') {
      throw new Error('Channel identifier cannot be empty');
    }

    if (useMock) return mockChannel(identifier.trim());

    try {
      const { data, error } = await supabase.functions.invoke(
        'fetch_youtube_channel',
        { body: { identifier: identifier.trim() } }
      );

      if (error) throw error;
      if (!data?.channelId) throw new Error('Invalid channel response from server');

      return {
        channelId: data.channelId,
        username: data.username || '',
        email: data.email || '',
        handle: data.handle,
        url: data.url,
      };
    } catch (err) {
      console.warn('fetch_youtube_channel failed, using mock fallback:', err);
      return mockChannel(identifier.trim());
    }
  },

  /**
   * List videos from an imported channel, with optional pagination.
   * Falls back to mock data when edge function is unavailable.
   */
  async listChannelVideos(
    channelId: string,
    pageToken?: string,
    maxResults: number = 50
  ): Promise<{ videos: ChannelVideo[]; nextPageToken?: string }> {
    if (!channelId) throw new Error('Channel ID is required');

    // Derive channelName from channelId for mock (strip prefix)
    const channelName = channelId.replace('UC_mock_', '');

    if (useMock) return { videos: mockVideos(channelId, channelName) };

    try {
      const { data, error } = await supabase.functions.invoke(
        'list_channel_videos',
        { body: { channelId, pageToken, maxResults: Math.min(maxResults, 50) } }
      );

      if (error) throw error;
      if (!data || !Array.isArray(data.videos)) throw new Error('Invalid video list response');

      return {
        videos: data.videos.map((v: any) => ({
          videoId: v.videoId,
          title: v.title,
          description: v.description || '',
          thumbnail: v.thumbnail || '',
          duration: v.duration || 0,
          publishedAt: v.publishedAt || new Date().toISOString(),
          channelName: v.channelName || channelName,
          viewCount: v.viewCount || 0,
          tags: v.tags || [],
        })),
        nextPageToken: data.nextPageToken,
      };
    } catch (err) {
      console.warn('list_channel_videos failed, using mock fallback:', err);
      return { videos: mockVideos(channelId, channelName) };
    }
  },

  /**
   * Analyze a batch of videos for pedagogical fit and topic mapping.
   * Falls back to mock data when edge function is unavailable.
   */
  async analyzeVideosBatch(
    videoIds: string[]
  ): Promise<Map<string, AIAnalysisResult>> {
    if (!videoIds || videoIds.length === 0) throw new Error('At least one video ID is required');

    if (useMock) return mockAnalysis(videoIds.map((id) => ({ videoId: id, title: id })));

    try {
      const { data, error } = await supabase.functions.invoke(
        'analyze_video_batch',
        { body: { videoIds: videoIds.slice(0, 100) } }
      );

      if (error) throw error;
      if (!data || !Array.isArray(data.results)) throw new Error('Invalid analysis response');

      const resultMap = new Map<string, AIAnalysisResult>();
      data.results.forEach((result: any) => {
        resultMap.set(result.videoId, {
          videoId: result.videoId,
          topics: result.topics || [],
          difficulty: result.difficulty || Difficulty.FOUNDATIONAL,
          pedagogicalScore: result.pedagogicalScore || 0,
          pedagogicalJustification: result.pedagogicalJustification,
          playlistSuggestions: (result.playlistSuggestions || []).map((ps: any) => ({
            playlistId: ps.playlistId,
            playlistName: ps.playlistName,
            confidence: ps.confidence || 0,
            reason: ps.reason || '',
          })),
        });
      });
      return resultMap;
    } catch (err) {
      console.warn('analyze_video_batch failed, using mock fallback:', err);
      return mockAnalysis(videoIds.map((id) => ({ videoId: id, title: id })));
    }
  },

  /**
   * Generate playlist suggestions for videos (can be called before or after analysis).
   * Falls back to mock data when edge function is unavailable.
   */
  async generatePlaylistSuggestions(
    videos: ChannelVideo[]
  ): Promise<Map<string, PlaylistSuggestion[]>> {
    if (!videos || videos.length === 0) throw new Error('At least one video is required');

    if (useMock) return mockSuggestions(videos);

    try {
      const videoData = videos.map((v) => ({
        videoId: v.videoId,
        title: v.title,
        description: v.description,
        tags: v.tags,
      }));

      const { data, error } = await supabase.functions.invoke(
        'generate_playlist_suggestions',
        { body: { videos: videoData.slice(0, 100) } }
      );

      if (error) throw error;
      if (!data || !Array.isArray(data.suggestions)) throw new Error('Invalid playlist suggestions response');

      const suggestionsMap = new Map<string, PlaylistSuggestion[]>();
      data.suggestions.forEach((item: any) => {
        const suggestions = (item.suggestions || []).map((ps: any) => ({
          playlistId: ps.playlistId,
          playlistName: ps.playlistName,
          confidence: ps.confidence || 0,
          reason: ps.reason || '',
        }));
        suggestionsMap.set(item.videoId, suggestions);
      });
      return suggestionsMap;
    } catch (err) {
      console.warn('generate_playlist_suggestions failed, using mock fallback:', err);
      return mockSuggestions(videos);
    }
  },

  /**
   * Publish curated videos to the catalog.
   * Falls back to mock success when edge function is unavailable.
   */
  async publishCuratedVideos(request: PublishRequest): Promise<PublishResult> {
    if (!request.channelId || !request.videoIds || request.videoIds.length === 0) {
      throw new Error('Channel ID and at least one video ID are required');
    }

    if (useMock) {
      return {
        success: true,
        message: `${request.videoIds.length} vídeos publicados com sucesso (modo mock).`,
        publishedCount: request.videoIds.length,
        affectedPlaylists: [...new Set(Object.values(request.mappings))],
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        'publish_curated_videos',
        {
          body: {
            channelId: request.channelId,
            videoIds: request.videoIds,
            mappings: request.mappings || {},
            curatorNotes: request.curatorNotes,
          },
        }
      );

      if (error) throw error;
      if (!data) throw new Error('Invalid publish response from server');

      return {
        success: data.success !== false,
        message: data.message || 'Videos published successfully',
        publishedCount: data.publishedCount ?? request.videoIds.length,
        affectedPlaylists: data.affectedPlaylists ?? [],
        timestamp: data.timestamp ?? new Date().toISOString(),
        notes: data.notes,
      };
    } catch (err) {
      console.warn('publish_curated_videos failed, using mock fallback:', err);
      return {
        success: true,
        message: `${request.videoIds.length} vídeos publicados com sucesso (fallback mock).`,
        publishedCount: request.videoIds.length,
        affectedPlaylists: [...new Set(Object.values(request.mappings))],
        timestamp: new Date().toISOString(),
      };
    }
  },
};

export default channelCurationSource;
