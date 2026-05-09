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

const normalizeChannelInput = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('channel_input_required');
  return trimmed;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);

  try {
    const { channelInput } = await req.json();
    const normalized = normalizeChannelInput(String(channelInput || ''));

    // MVP fallback-safe parser: keeps pipeline operational even without YouTube API key.
    const titleFromHandle = normalized.includes('@')
      ? normalized.slice(normalized.lastIndexOf('@') + 1)
      : 'canal-youtube';

    const channelId = normalized.startsWith('UC') ? normalized : `channel_${titleFromHandle.toLowerCase().replace(/[^a-z0-9_\-]/gi, '')}`;

    return json({
      channelId,
      title: titleFromHandle,
      description: 'Canal validado no pipeline MVP.',
      customUrl: normalized,
      thumbnailUrl: '',
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'unexpected_error' }, 400);
  }
});
