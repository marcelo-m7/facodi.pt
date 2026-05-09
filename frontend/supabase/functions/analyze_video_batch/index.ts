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

const inferDifficulty = (text: string): 'foundational' | 'intermediate' | 'advanced' | 'expert' => {
  const lower = text.toLowerCase();
  if (lower.includes('introducao') || lower.includes('básico') || lower.includes('basic')) return 'foundational';
  if (lower.includes('avancado') || lower.includes('advanced')) return 'advanced';
  if (lower.includes('especialista') || lower.includes('expert')) return 'expert';
  return 'intermediate';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);

  try {
    const { videos } = await req.json();
    if (!Array.isArray(videos) || videos.length === 0) {
      return json({ error: 'videos_required' }, 400);
    }

    const analyses = videos.map((video: any) => {
      const title = String(video.title || '');
      return {
        videoId: String(video.id || ''),
        summary: `Resumo pedagógico automático para ${title}.`,
        pedagogicalReason: 'Conteúdo com potencial de apoio em trilhas de aprendizagem aberta.',
        topic: title.split('-')[0]?.trim() || 'tópico geral',
        difficulty: inferDifficulty(title),
        tags: ['facodi', 'curadoria', 'youtube'],
      };
    });

    return json(analyses);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'unexpected_error' }, 400);
  }
});
