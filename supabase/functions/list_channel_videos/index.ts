import {
  corsHeaders,
  enforceRateLimit,
  ensurePostMethod,
  HttpError,
  json,
  requireEditorOrAdmin,
  toErrorResponse,
} from '../_shared/pipelineSecurity.ts';

const nowIso = () => new Date().toISOString();

const buildFallbackVideos = (channelInput: string, maxVideos = 10) => {
  const count = Math.max(1, Math.min(maxVideos, 30));
  return Array.from({ length: count }).map((_, index) => ({
    id: `mock_video_${index + 1}`,
    title: `Video ${index + 1} do canal ${channelInput}`,
    description: 'Conteudo coletado em modo MVP fallback.',
    publishedAt: nowIso(),
    durationSeconds: 900 + index * 60,
    channelTitle: channelInput,
    thumbnailUrl: '',
    tags: ['facodi', 'educacao-aberta'],
  }));
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    ensurePostMethod(req);
    const auth = await requireEditorOrAdmin(req);
    enforceRateLimit(`list_channel_videos:${auth.userId}`, 20, 60_000);

    const { channelInput, brief } = await req.json();
    const normalized = String(channelInput || '').trim();
    if (!normalized) {
      throw new HttpError(400, 'channel_input_required', 'Channel input is required.');
    }
    if (normalized.length > 200) {
      throw new HttpError(400, 'channel_input_too_long', 'Channel input exceeds max length.');
    }

    const maxVideos = Number(brief?.maxVideos || 10);
    if (!Number.isFinite(maxVideos) || maxVideos <= 0) {
      throw new HttpError(400, 'invalid_max_videos', 'maxVideos must be greater than 0.');
    }

    // Safe MVP: return deterministic fallback list to avoid breaking pipeline if API is unavailable.
    return json(buildFallbackVideos(normalized, maxVideos));
  } catch (error) {
    return toErrorResponse(error);
  }
});
