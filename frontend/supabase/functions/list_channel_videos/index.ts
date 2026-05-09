// deno-lint-ignore-file no-explicit-any
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

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
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);

  try {
    const { channelInput, brief } = await req.json();
    const normalized = String(channelInput || '').trim();
    if (!normalized) return json({ error: 'channel_input_required' }, 400);

    const maxVideos = Number(brief?.maxVideos || 10);

    // Safe MVP: return deterministic fallback list to avoid breaking pipeline if API is unavailable.
    return json(buildFallbackVideos(normalized, maxVideos));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'unexpected_error' }, 400);
  }
});
