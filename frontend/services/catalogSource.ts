import { COURSE_UNITS } from '../data/courses';
import { DEGREES } from '../data/degrees';
import { Category, Course, CurricularUnit, Difficulty } from '../types';

type OdooRecord = Record<string, unknown>;

type SearchReadResponse = {
  model: string;
  count: number;
  records: OdooRecord[];
};

export type CatalogSource = 'mock' | 'odoo';

export type CatalogPayload = {
  source: CatalogSource;
  courses: Course[];
  units: CurricularUnit[];
};

const DATA_SOURCE = (import.meta.env.VITE_DATA_SOURCE || 'mock').toLowerCase();
const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '');

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

async function postSearchRead(model: string, body: Record<string, unknown>): Promise<SearchReadResponse> {
  const response = await fetch(`${BACKEND_BASE_URL}/models/${model}/search_read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Backend error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

export async function loadCatalogData(): Promise<CatalogPayload> {
  if (DATA_SOURCE !== 'odoo') {
    return {
      source: 'mock',
      courses: DEGREES,
      units: COURSE_UNITS,
    };
  }

  try {
    const channels = await postSearchRead('slide.channel', {
      domain: [['enroll', '=', 'public']],
      fields: ['id', 'name', 'description', 'enroll', 'total_slides', 'total_time', 'website_url'],
      limit: 200,
      offset: 0,
    });

    const courses = channels.records
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
    channels.records.forEach((record) => {
      const channelId = Number(record.id);
      const mapped = mapChannelToCourse(record);
      if (channelId && mapped) {
        channelMap.set(channelId, mapped);
      }
    });

    const channelIds = [...channelMap.keys()];

    const slides = await postSearchRead('slide.slide', {
      domain: [['channel_id', 'in', channelIds]],
      fields: ['id', 'name', 'description', 'channel_id', 'sequence', 'completion_time', 'tag_ids', 'is_preview', 'slide_category'],
      limit: 2000,
      offset: 0,
      order: 'channel_id asc, sequence asc, id asc',
    });

    const units = slides.records
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
