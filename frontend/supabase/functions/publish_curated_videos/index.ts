// deno-lint-ignore-file no-explicit-any
import {
  corsHeaders,
  enforceRateLimit,
  ensurePostMethod,
  HttpError,
  json,
  requireAuthenticated,
  toErrorResponse,
} from '../_shared/pipelineSecurity.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    ensurePostMethod(req);
      const auth = await requireAuthenticated(req);
    enforceRateLimit(`publish_curated_videos:${auth.userId}`, 6, 60_000);

    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpError(400, 'items_required', 'At least one item is required.');
    }
    if (items.length > 50) {
      throw new HttpError(400, 'items_limit_exceeded', 'Maximum of 50 items per publish request.');
    }

    // Non-destructive MVP: normalize payload and delegate actual DB publication to existing frontend submit flow.
    const normalized = items.map((item: any) => ({
      video: item.video,
      analysis: item.analysis || null,
      suggestion: item.suggestion || null,
    }));

    return json(normalized);
  } catch (error) {
    return toErrorResponse(error);
  }
});
