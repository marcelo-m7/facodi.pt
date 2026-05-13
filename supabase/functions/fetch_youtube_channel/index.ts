import {
  corsHeaders,
  enforceRateLimit,
  ensurePostMethod,
  HttpError,
  json,
  requireEditorOrAdmin,
  toErrorResponse,
} from '../_shared/pipelineSecurity.ts';

const normalizeChannelInput = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) throw new HttpError(400, 'channel_input_required', 'Channel input is required.');
  if (trimmed.length > 200) {
    throw new HttpError(400, 'channel_input_too_long', 'Channel input exceeds max length.');
  }
  return trimmed;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    ensurePostMethod(req);
    const auth = await requireEditorOrAdmin(req);
    enforceRateLimit(`fetch_youtube_channel:${auth.userId}`, 30, 60_000);

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
    return toErrorResponse(error);
  }
});
