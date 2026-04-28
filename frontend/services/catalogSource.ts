import { COURSE_UNITS } from '../data/courses';
import { DEGREES } from '../data/degrees';
import { Category, Course, CurricularUnit, Difficulty } from '../types';

type OdooRecord = Record<string, unknown>;

type OdooJsonRpcResponse = {
  jsonrpc: string;
  id: null;
  result: OdooRecord[];
  error?: { message: string; data?: { message: string } };
};

export type CatalogSource = 'mock' | 'odoo';

export type CatalogPayload = {
  source: CatalogSource;
  courses: Course[];
  units: CurricularUnit[];
};

const DATA_SOURCE = (import.meta.env.VITE_DATA_SOURCE || 'mock').toLowerCase();

// In dev the Vite proxy rewrites /odoo → https://edu-facodi.odoo.com (avoids CORS).
// In production, VITE_BACKEND_URL should be a real backend proxy URL.
const ODOO_BASE =
  import.meta.env.DEV
    ? '/odoo'
    : (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

let _sessionCookie: string | null = null;

/**
 * Authenticate once and cache the session. Uses credentials baked into the
 * Vite dev proxy target; the password is never sent from the browser —
 * authentication happens server-side in the proxy target.
 *
 * For Odoo public data (enroll=public), a guest session is sufficient.
 * We call authenticate with empty credentials to get a public session.
 */
async function ensureSession(): Promise<void> {
  if (_sessionCookie) return;
  const response = await fetch(`${ODOO_BASE}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { db: 'edu-facodi', login: '', password: '' },
    }),
  });
  // Even a failed auth response sets the session cookie for public access
  const cookie = response.headers.get('set-cookie');
  if (cookie) _sessionCookie = cookie;
}

async function callKw(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown>,
): Promise<OdooRecord[]> {
  await ensureSession();
  const response = await fetch(`${ODOO_BASE}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { model, method, args, kwargs },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Odoo HTTP error ${response.status}: ${text}`);
  }

  const json: OdooJsonRpcResponse = await response.json();
  if (json.error) {
    const msg = json.error.data?.message ?? json.error.message;
    throw new Error(`Odoo RPC error: ${msg}`);
  }

  return json.result;
}

const stripHtml = (input: string): string => input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeCourseId = (channelId: number, channelName: string): string => {
  const name = channelName.toLowerCase();
  if (name.includes('engenharia') && name.includes('tecnologias da informação')) {
    return 'LESTI';
  }
  if (name.includes('design de comunicação')) {
    return 'LDCOM';
  }
  return `ODOO-${channelId}`;
};

const pickCategoryFromCourse = (courseTitle: string): Category => {
  const title = courseTitle.toLowerCase();
  if (title.includes('design')) {
    return Category.DESIGN;
  }
  if (title.includes('engenharia') || title.includes('tecnologias da informação') || title.includes('informação')) {
    return Category.COMPUTER_SCIENCE;
  }
  return Category.HUMANITIES;
};

const mapChannelToCourse = (record: OdooRecord): Course | null => {
  const id = Number(record.id);
  const title = String(record.name || '').trim();
  if (!id || !title) {
    return null;
  }

  const description = stripHtml(String(record.description || ''));
  const courseId = normalizeCourseId(id, title);
  const totalSlides = Number(record.total_slides || 0);
  const totalTime = Number(record.total_time || 0);
  const enroll = String(record.enroll || '').trim();

  return {
    id: courseId,
    title,
    description: description || 'Curso sincronizado do Odoo.',
    ects: 0,
    semesters: 0,
    institution: 'Odoo eLearning',
    school: 'slide.channel',
    degreeType: 'other',
    language: 'pt',
    longDescription:
      description ||
      `Curso sincronizado de slide.channel (slides: ${Number.isFinite(totalSlides) ? totalSlides : 0}, horas: ${
        Number.isFinite(totalTime) ? totalTime : 0
      }, enrollment: ${enroll || 'n/a'}).`,
  };
};

const mapSlideToUnit = (record: OdooRecord, channelMap: Map<number, Course>): CurricularUnit | null => {
  const id = Number(record.id);
  const name = String(record.name || '').trim();
  const description = String(record.description || '').trim();
  const channelTuple = Array.isArray(record.channel_id) ? record.channel_id : [];
  const channelId = Number(channelTuple[0]);
  const channel = channelMap.get(channelId);

  if (!id || !name || !channel) {
    return null;
  }

  const cleanDescription = stripHtml(description);
  const completionHours = Number(record.completion_time || 0);
  const slideCategory = String(record.slide_category || '').trim();
  const isPreview = Boolean(record.is_preview);

  return {
    id: String(id),
    name,
    description: cleanDescription || 'Conteudo sincronizado do Odoo.',
    content: cleanDescription || undefined,
    ects: 0,
    semester: 1,
    year: 1,
    category: pickCategoryFromCourse(channel.title),
    difficulty: Difficulty.FOUNDATIONAL,
    duration: completionHours > 0 ? `${completionHours} Horas` : 'N/A',
    contributor: 'Odoo eLearning',
    tags: [slideCategory || 'document', isPreview ? 'preview' : 'published'].filter(Boolean),
    courseId: channel.id,
  };
};

export async function loadCatalogData(): Promise<CatalogPayload> {
  if (DATA_SOURCE !== 'odoo') {
    return {
      source: 'mock',
      courses: DEGREES,
      units: COURSE_UNITS,
    };
  }

  try {
    const channelRecords = await callKw(
      'slide.channel',
      'search_read',
      [[['enroll', '=', 'public']]],
      {
        fields: ['id', 'name', 'description', 'enroll', 'total_slides', 'total_time', 'website_url'],
        limit: 200,
        offset: 0,
      },
    );

    const courses = channelRecords
      .map(mapChannelToCourse)
      .filter((course): course is Course => Boolean(course));

    if (!courses.length) {
      return {
        source: 'mock',
        courses: DEGREES,
        units: COURSE_UNITS,
      };
    }

    const channelMap = new Map<number, Course>();
    channelRecords.forEach((record) => {
      const channelId = Number(record.id);
      const mapped = mapChannelToCourse(record);
      if (channelId && mapped) {
        channelMap.set(channelId, mapped);
      }
    });

    const channelIds = [...channelMap.keys()];

    const slideRecords = await callKw(
      'slide.slide',
      'search_read',
      [[['channel_id', 'in', channelIds]]],
      {
        fields: ['id', 'name', 'description', 'channel_id', 'sequence', 'completion_time', 'tag_ids', 'is_preview', 'slide_category'],
        limit: 2000,
        offset: 0,
        order: 'channel_id asc, sequence asc, id asc',
      },
    );

    const units = slideRecords
      .map((record) => mapSlideToUnit(record, channelMap))
      .filter((unit): unit is CurricularUnit => Boolean(unit));

    return {
      source: 'odoo',
      courses,
      units: units.length ? units : COURSE_UNITS,
    };
  } catch (error) {
    console.warn('Falling back to mock data source:', error);
    return {
      source: 'mock',
      courses: DEGREES,
      units: COURSE_UNITS,
    };
  }
}
