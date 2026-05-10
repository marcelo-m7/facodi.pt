interface AuthContext {
  userId: string;
  role: string;
}

interface RateWindow {
  count: number;
  resetAt: number;
}

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export const toErrorResponse = (error: unknown): Response => {
  if (error instanceof HttpError) {
    return json({ error: error.code, message: error.message }, error.status);
  }
  return json({ error: 'unexpected_error', message: 'Unexpected server error.' }, 500);
};

const getBearerToken = (req: Request): string => {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'unauthorized', 'Missing bearer token.');
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new HttpError(401, 'unauthorized', 'Invalid bearer token.');
  }
  return token;
};

const getEnv = (name: string): string => {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new HttpError(500, 'misconfigured_environment', `Missing ${name} environment variable.`);
  }
  return value;
};

const fetchUser = async (supabaseUrl: string, anonKey: string, token: string): Promise<{ id: string }> => {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new HttpError(401, 'unauthorized', 'Invalid token.');
  }

  const user = (await response.json()) as { id?: string };
  if (!user?.id) {
    throw new HttpError(401, 'unauthorized', 'Token without user id.');
  }

  return { id: user.id };
};

const fetchProfileRole = async (
  supabaseUrl: string,
  anonKey: string,
  token: string,
  userId: string,
): Promise<string> => {
  const roleLookup = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!roleLookup.ok) {
    throw new HttpError(403, 'forbidden', 'Unable to verify profile role.');
  }

  const rows = (await roleLookup.json()) as Array<{ role?: string }>;
  const role = rows[0]?.role || 'user';
  return role;
};

export const requireEditorOrAdmin = async (req: Request): Promise<AuthContext> => {
  const token = getBearerToken(req);
  const supabaseUrl = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');

  const user = await fetchUser(supabaseUrl, anonKey, token);
  const role = await fetchProfileRole(supabaseUrl, anonKey, token, user.id);

  if (role !== 'editor' && role !== 'admin') {
    throw new HttpError(403, 'forbidden', 'Editor or Admin role required.');
  }

  return { userId: user.id, role };
};


export const requireCuratorOrHigher = async (req: Request): Promise<AuthContext> => {
  const token = getBearerToken(req);
  const supabaseUrl = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');

  const user = await fetchUser(supabaseUrl, anonKey, token);
  const role = await fetchProfileRole(supabaseUrl, anonKey, token, user.id);

  if (role !== 'curator' && role !== 'editor' && role !== 'admin') {
    throw new HttpError(403, 'forbidden', 'Curator, Editor, or Admin role required.');
  }

  return { userId: user.id, role };
};

export const requireAuthenticated = async (req: Request): Promise<AuthContext> => {
  const token = getBearerToken(req);
  const supabaseUrl = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');

  const user = await fetchUser(supabaseUrl, anonKey, token);
  const role = await fetchProfileRole(supabaseUrl, anonKey, token, user.id);

  return { userId: user.id, role };
};

const rateWindows = new Map<string, RateWindow>();

export const enforceRateLimit = (key: string, limit: number, windowMs: number): void => {
  const now = Date.now();
  const current = rateWindows.get(key);

  if (!current || now >= current.resetAt) {
    rateWindows.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new HttpError(429, 'rate_limited', 'Rate limit exceeded. Try again later.');
  }

  current.count += 1;
  rateWindows.set(key, current);
};

export const ensurePostMethod = (req: Request): void => {
  if (req.method !== 'POST') {
    throw new HttpError(405, 'method_not_allowed', 'Only POST is allowed.');
  }
};
