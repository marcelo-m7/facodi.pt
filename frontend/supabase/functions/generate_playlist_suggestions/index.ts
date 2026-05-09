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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);

  try {
    const { videos, analyses } = await req.json();
    if (!Array.isArray(videos) || !Array.isArray(analyses)) {
      return json({ error: 'videos_and_analyses_required' }, 400);
    }

    const suggestions = videos.map((video: any) => {
      const analysis = analyses.find((item: any) => String(item.videoId) === String(video.id));
      const confidence = analysis ? 0.72 : 0.4;
      return {
        videoId: String(video.id || ''),
        courseId: undefined,
        unitId: undefined,
        playlistId: undefined,
        confidence,
      };
    });

    return json(suggestions);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'unexpected_error' }, 400);
  }
});
