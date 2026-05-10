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
    enforceRateLimit(`generate_playlist_suggestions:${auth.userId}`, 10, 60_000);

    const { videos, analyses } = await req.json();
    if (!Array.isArray(videos) || !Array.isArray(analyses)) {
      throw new HttpError(400, 'videos_and_analyses_required', 'videos and analyses are required arrays.');
    }
    if (videos.length > 50 || analyses.length > 50) {
      throw new HttpError(400, 'batch_limit_exceeded', 'Maximum of 50 videos/analyses per request.');
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
    return toErrorResponse(error);
  }
});
