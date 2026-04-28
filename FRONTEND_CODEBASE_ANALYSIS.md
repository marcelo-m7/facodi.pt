# FACODI Frontend Codebase Analysis
**Date:** April 28, 2026  
**Focus:** Odoo data integration, data flow, mock data, and blockers preventing live Odoo data display

---

## 1. Folder Structure

```
frontend/
├── App.tsx                           # Entry point, routing, state management
├── index.tsx                         # React root mount
├── types.ts                          # Shared domain types (Course, CurricularUnit, Playlist)
├── vite.config.ts                    # Vite config with Odoo proxy
├── playwright.config.ts              # E2E test config
├── .env.local                        # Environment variables (local-only, not committed)
├── .env.example                      # Template for .env.local
│
├── components/                       # Page-level React components
│   ├── App.tsx                       # (Note: main App.tsx is in root)
│   ├── Home.tsx                      # Landing page
│   ├── Courses.tsx                   # Course listing
│   ├── Courses.tsx                   # Degree listing
│   ├── CourseDetail.tsx              # (Old: deprecated, still referenced)
│   ├── LessonDetail.tsx              # ⭐ Lesson/unit detail with video player
│   ├── Dashboard.tsx                 # Saved lessons view
│   ├── Layout.tsx                    # Navigation bar, theme toggle
│   ├── CourseCard.tsx                # Course card component
│   ├── PlaylistCard.tsx              # Playlist card component
│   ├── AINavigator.tsx               # Gemini AI chat (planned feature)
│   ├── Contributors.tsx              # Contributors page
│   ├── LearningPaths.tsx             # (Planned feature)
│   ├── MarkdownView.tsx              # Markdown renderer for descriptions
│
├── services/
│   └── catalogSource.ts              # ⭐ SINGLE GATEWAY for all Odoo/mock data
│
├── data/                             # Static mock data
│   ├── courses.ts                    # Mock CurricularUnit[] (COURSE_UNITS)
│   ├── degrees.ts                    # Mock Course[] (DEGREES: LDCOM, LESTI)
│   ├── playlists.ts                  # Mock Playlist[] (PLAYLISTS)
│   └── i18n.ts                       # Portuguese & English translations
│
├── tests/
│   └── e2e/
│       ├── routes.spec.ts            # 5 smoke tests (home, courses, routing, dark mode)
│       ├── lesson-detail.spec.ts     # 11 video rendering + layout tests
│       └── lesson-navigation.spec.ts # 11 navigation flow tests
│
└── dist/                             # Production build (generated)
```

---

## 2. Odoo Data Integration

### 2.1 Architecture: Single Gateway Pattern

**All Odoo data access flows through ONE file: [`services/catalogSource.ts`](services/catalogSource.ts)**

- Components **never** call Odoo directly
- Components consume only `types.ts` domain types
- All API calls, error handling, and data mapping happen in `catalogSource.ts`

### 2.2 Data Source Toggle

| Variable | Location | Current Value | Effect |
|---|---|---|---|
| `VITE_DATA_SOURCE` | `.env.local` | `'odoo'` | Controls `DATA_SOURCE` constant in `catalogSource.ts` |
| `DATA_SOURCE` constant | `catalogSource.ts` line 24 | `(import.meta.env.VITE_DATA_SOURCE \|\| 'mock').toLowerCase()` | Routes to Odoo or mock path |
| Check in `loadCatalogData()` | `catalogSource.ts` line 279 | `if (DATA_SOURCE !== 'odoo')` | **If FALSE → returns mock data** |

**Current state:**
- ✅ `VITE_DATA_SOURCE=odoo` is set in `.env.local`
- ✅ Vite proxy is configured in `vite.config.ts`
- ⚠️ **Odoo path should activate**, but may fail silently if session/auth fails

### 2.3 Odoo JSON-RPC Implementation

**File:** [`services/catalogSource.ts`](services/catalogSource.ts) lines 27-89

#### Authentication Flow
```typescript
async function ensureSession(): Promise<void> {
  // Calls: POST /web/session/authenticate
  // Params: db, login, password
  // On success: sets session cookie for subsequent RPC calls
  // On failure: still returns public session (fallback)
}
```

**Hardcoded Credentials Found:**
```typescript
params: { 
  db: 'edu-facodi', 
  login: 'marcelo@monynha.com', 
  password: 'cd4b7f7d88aa8537c8a9ce91c2cd1c5fecb88088'  // ⚠️ EXPOSED
}
```

#### RPC Call Pattern
```typescript
async function callKw(model, method, args, kwargs): Promise<OdooRecord[]> {
  // POST /web/dataset/call_kw
  // JSON-RPC 2.0 format
  // credentials: 'include' (sends cookies)
  // Returns: OdooRecord[] or throws error
}
```

#### Data Fetching (`loadCatalogData()`)

**Step 1: Fetch Courses (slide.channel)**
```typescript
const channelRecords = await callKw(
  'slide.channel',
  'search_read',
  [[['enroll', '=', 'public']]],  // Domain: find public courses
  {
    fields: [
      'id', 'name', 'description', 'description_short',
      'website_absolute_url', 'total_time',
      'x_facodi_source_institution',      // Custom field
      'x_facodi_curriculum_version',      // Custom field
      'x_facodi_workload_hours',          // Custom field
      'x_facodi_primary_language',        // Custom field
      'x_facodi_content_license',         // Custom field
      'x_facodi_project_name'             // Custom field
    ],
    limit: 200,
    offset: 0
  }
);
```

**Step 2: Fetch Lessons (slide.slide) in those courses**
```typescript
const slideRecords = await callKw(
  'slide.slide',
  'search_read',
  [[['channel_id', 'in', channelIds]]],  // Filter by parent courses
  {
    fields: [
      'id', 'name', 'description', 'html_content', 'channel_id', 'category_id',
      'sequence', 'completion_time', 'is_preview', 'slide_category',
      'is_category', 'website_absolute_url', 'video_url',  // ⭐ VIDEO FIELD
      'x_facodi_unit_code',               // Custom field
      'x_facodi_duration_minutes',        // Custom field
      'x_facodi_source_institution',      // Custom field
      'x_facodi_editorial_state'          // Custom field
    ],
    limit: 2000,
    offset: 0,
    order: 'channel_id asc, sequence asc, id asc'
  }
);
```

### 2.4 Data Mapping (Odoo → Frontend Types)

#### Course Mapping: `slide.channel` → `Course`
**Function:** `mapChannelToCourse(record)` (lines 204-243)

| Odoo Field | Frontend Field | Transform |
|---|---|---|
| `id` | `id` | via `normalizeCourseId(id, name)` |
| `name` | `title` | string |
| `description \| description_short` | `description` | HTML-stripped |
| `x_facodi_source_institution` | `institution` | string (fallback: "Odoo eLearning") |
| `x_facodi_project_name` | `school` | string (fallback: "FACODI") |
| `x_facodi_workload_hours` | `ects` | `Math.round(hours / 25)` |
| `website_absolute_url` | `websiteUrl` | string or undefined |
| `x_facodi_primary_language` | `language` | split on '-' |
| name contains "engenharia" or "design"? | `degreeType` | 'bachelor' or 'other' |

#### Lesson Mapping: `slide.slide` → `CurricularUnit`
**Function:** `mapSlideToUnit(record, channelMap)` (lines 245-275)

| Odoo Field | Frontend Field | Transform |
|---|---|---|
| `id` | `id` | string |
| `name` | `name` | string |
| `description` | `description` | HTML-stripped |
| `channel_id[0]` | `courseId` | lookup in channelMap |
| `category_id[1]` (section name) | `year`, `semester` | parse "1o Ano - 1o Semestre" regex |
| `x_facodi_unit_code` | `unitCode` | string or undefined |
| `x_facodi_duration_minutes` | `duration` | formatted "X min" or "Xh" |
| `video_url` | `videoUrl` | string or undefined ⭐ |
| `slide_category` | `tags` | array including category |
| `is_preview` | `tags` | "preview" tag if true |
| `x_facodi_source_institution` | `contributor` | string |

---

## 3. Mock Data

### 3.1 Location & Purpose

| File | Type | Usage |
|---|---|---|
| [`data/degrees.ts`](data/degrees.ts) | `Course[]` | DEGREES export (2 courses: LDCOM, LESTI) |
| [`data/courses.ts`](data/courses.ts) | `CurricularUnit[]` | COURSE_UNITS export (134+ lessons) |
| [`data/playlists.ts`](data/playlists.ts) | `Playlist[]` | PLAYLISTS export (YouTube playlists) |

### 3.2 Mock Data in Practice

**When is mock data used?**
```typescript
export async function loadCatalogData(): Promise<CatalogPayload> {
  if (DATA_SOURCE !== 'odoo') {
    return {
      source: 'mock',
      courses: DEGREES,
      units: COURSE_UNITS,
      playlists: PLAYLISTS,
    };
  }
  // ... otherwise fetch from Odoo
}
```

**Fallback on Odoo Error:**
```typescript
// In App.tsx
loadCatalogData()
  .then(payload => {
    setCourses(payload.courses);
    setUnits(payload.units);
    setPlaylists(payload.playlists);
    setCatalogSource(payload.source);  // 'mock' or 'odoo'
  })
  .catch(error => {
    // ⚠️ ON ANY ERROR:
    setCatalogError(error.message);    // Display error to user
    setCourses([]);                     // Clear data
    setUnits([]);
    setPlaylists([]);
    // NO AUTOMATIC FALLBACK TO MOCK — error fatal
  });
```

**Critical Finding:** If Odoo fetch fails, the UI shows error and **no data at all** (not even mock). This is by design for testing.

---

## 4. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Initialization: App.tsx useEffect                           │
└─────────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ loadCatalogData() [catalogSource.ts]                        │
└─────────────────────────────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ↓                       ↓
    DATA_SOURCE ≠ 'odoo'    DATA_SOURCE = 'odoo'
            │                       │
            ↓                       ↓
    ┌──────────────┐        ┌──────────────────────┐
    │ Return Mock: │        │ Odoo JSON-RPC Call  │
    │ DEGREES      │        │ 1. ensureSession()  │
    │ COURSE_UNITS │        │ 2. callKw()         │
    │ PLAYLISTS    │        │ 3. map data         │
    └──────────────┘        └──────────────────────┘
            │                       │
            │              ┌────────┴────────┐
            │              ↓                 ↓
            │         Fetch Courses    Fetch Lessons
            │         (slide.channel)  (slide.slide)
            │              │                 │
            │              ↓                 ↓
            │         mapChannelToCourse  mapSlideToUnit
            │              │                 │
            │              └────────┬────────┘
            │                       │
            └───────────┬───────────┘
                        ↓
        ┌───────────────────────────────┐
        │ Return CatalogPayload          │
        │ {                              │
        │   source: 'mock' | 'odoo',    │
        │   courses: Course[],           │
        │   units: CurricularUnit[],     │
        │   playlists: Playlist[]        │
        │ }                              │
        └───────────────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────┐
        │ App.tsx setState               │
        │ setCourses()                   │
        │ setUnits()                     │
        │ setPlaylists()                 │
        │ setCatalogSource()             │
        └───────────────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────┐
        │ Components (Home, Courses,     │
        │ LessonDetail, etc.)            │
        │ Consume via props              │
        └───────────────────────────────┘
```

---

## 5. Hardcoded Data Sources & Conditionals

### 5.1 Hardcoded Credentials ⚠️ SECURITY ISSUE

**File:** [`services/catalogSource.ts`](services/catalogSource.ts) line 55-67

```typescript
async function ensureSession(): Promise<void> {
  // ...
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'call',
    params: { 
      db: 'edu-facodi', 
      login: 'marcelo@monynha.com', 
      password: 'cd4b7f7d88aa8537c8a9ce91c2cd1c5fecb88088'  // ⚠️ HARDCODED
    },
  }),
}
```

**Issues:**
1. **Password exposed in source code** (visible in git history)
2. **Cannot rotate credentials** without code change
3. **Public on GitHub** if repo is public
4. **Should use environment variables** or backend proxy

**Recommended Fix:**
```typescript
// Use .env.local credentials instead
params: {
  db: import.meta.env.VITE_ODOO_DB,
  login: import.meta.env.VITE_ODOO_USERNAME,
  password: import.meta.env.VITE_ODOO_PASSWORD
}
```

### 5.2 Course ID Normalization (Hardcoded Mappings)

**Function:** `normalizeCourseId(channelId, channelName)` (lines 93-104)

```typescript
const normalizeCourseId = (channelId: number, channelName: string): string => {
  const name = channelName.toLowerCase();
  if (name.includes('engenharia') && name.includes('tecnologias da informação')) {
    return 'LESTI';  // ⚠️ Hardcoded mapping
  }
  if (name.includes('design de comunicação')) {
    return 'LDCOM';  // ⚠️ Hardcoded mapping
  }
  return `ODOO-${channelId}`;  // Fallback
};
```

**Impact:**
- Course IDs are determined by name patterns
- If Odoo course names change → IDs break
- No database mapping table
- **Workaround:** Use Odoo custom field `x_facodi_course_id` instead of name-based logic

### 5.3 Category Detection (Hardcoded Rules)

**Function:** `pickCategoryFromCourse(courseTitle)` (lines 106-111)

```typescript
const pickCategoryFromCourse = (courseTitle: string): Category => {
  const title = courseTitle.toLowerCase();
  if (title.includes('design')) return Category.DESIGN;
  if (title.includes('engenharia') || ...) return Category.COMPUTER_SCIENCE;
  return Category.HUMANITIES;  // Default
};
```

**Impact:**
- Categories inferred from course name (fragile)
- Should use Odoo custom field `x_facodi_category` instead

### 5.4 Environment-Based Data Source

**File:** `.env.local`

```
VITE_DATA_SOURCE=odoo
VITE_BACKEND_URL=https://edu-facodi.odoo.com
```

**Conditional in code:**
```typescript
if (DATA_SOURCE !== 'odoo') {
  return { source: 'mock', ... };
}
```

**✅ This is correct design** — single environment variable controls live vs. mock.

---

## 6. Current Test State

### 6.1 E2E Tests (Playwright)

**Location:** [`tests/e2e/`](tests/e2e/)

| Test File | Tests | Status | Purpose |
|---|---|---|---|
| [`routes.spec.ts`](tests/e2e/routes.spec.ts) | 5 | ✅ PASSING | Smoke tests: home, courses, routing, dark mode |
| [`lesson-detail.spec.ts`](tests/e2e/lesson-detail.spec.ts) | 11 | ✅ WRITTEN | Video rendering (3 states), layout, accessibility |
| [`lesson-navigation.spec.ts`](tests/e2e/lesson-navigation.spec.ts) | 11 | ✅ WRITTEN | URL format, navigation flows, cross-course |
| **Total** | **27** | **Ready** | Comprehensive E2E coverage |

**Test Server Config:**
- Runs: `npm run dev -- --host 0.0.0.0 --port 4173`
- Base URL: `http://127.0.0.1:4173`
- Timeout: 60 seconds per test

### 6.2 Unit Tests

**Status:** ❌ NO UNIT TESTS currently (only E2E)

---

## 7. Issues Preventing Odoo Data Display

### 7.1 Known Blocker: Odoo SaaS Session Issue

**Root Cause:** Odoo SaaS JSON-RPC through Vite dev proxy has cookie/session forwarding problems

**Symptom:** 
- `loadCatalogData()` calls succeed but return empty arrays
- OR error: "Session expired"
- Tests see only mock data (fallback)

**Evidence:**
- Hardcoded credentials don't help (session is stateful on server side)
- Vite proxy `credentials: 'include'` doesn't forward cookies properly
- Odoo checks session on each RPC call; proxy doesn't replicate session state

**Documented in:** [`docs/guides/PLAYWRIGHT-STRATEGY.md`](../docs/guides/PLAYWRIGHT-STRATEGY.md)

### 7.2 Missing Backend Proxy

**Current Setup:**
- Vite dev proxy at `http://127.0.0.1:3000` → `https://edu-facodi.odoo.com`
- Browser-side JSON-RPC (stateless)

**Needed for Production:**
- Real backend proxy (Node.js/Express/Python)
- Maintains authenticated session on server
- Frontend calls `/api/odoo/*` → backend maintains session
- No cookie/auth complexity

### 7.3 Hardcoded Credentials Exposure

**File:** [`services/catalogSource.ts`](services/catalogSource.ts) line 60-67

**Issue:** Password visible in source code

**Impact:**
- Impossible to use live Odoo path safely
- Credentials rotate → code must change
- Public repository = exposed credentials

### 7.4 Error Handling Gap

**File:** [`App.tsx`](App.tsx) lines 102-111

```typescript
loadCatalogData()
  .catch(error => {
    setCatalogError(error.message);
    setCourses([]);
    setUnits([]);
    setPlaylists([]);
    // ❌ NO AUTOMATIC FALLBACK TO MOCK
  });
```

**Issue:** If Odoo fetch fails, user sees error + no data (not even mock)

**Better UX:** 
```typescript
.catch(error => {
  console.warn('Odoo fetch failed, using mock:', error);
  setCatalogError('Using offline mode');  // Softer message
  // Return mock data instead of empty
  setCourses(DEGREES);
  setUnits(COURSE_UNITS);
  setPlaylists(PLAYLISTS);
  setCatalogSource('mock');
});
```

---

## 8. Current Video Implementation

### 8.1 Video Field Mapping

| Source | Field | Type | Status |
|---|---|---|---|
| Odoo `slide.slide` | `video_url` | char | ✅ Fetched in `callKw()` |
| Frontend `CurricularUnit` | `videoUrl` | string \| undefined | ✅ Mapped in `mapSlideToUnit()` |

### 8.2 Video Rendering in LessonDetail

**File:** [`components/LessonDetail.tsx`](components/LessonDetail.tsx) lines 12-74

**Three Rendering States:**

1. **YouTube iframe embed** (if `videoUrl` is YouTube)
   ```html
   <iframe src="https://www.youtube.com/embed/{VIDEO_ID}" />
   ```

2. **External link fallback** (if `videoUrl` is not YouTube)
   ```html
   <a href={videoUrl} target="_blank">Abrir vídeo</a>
   ```

3. **Placeholder** (if no `videoUrl`)
   ```html
   <div>Conteúdo em texto</div>
   ```

### 8.3 Video Data Status in Odoo

**From session notes:**
- ✅ 20 lessons seeded with YouTube video URLs
- 2 courses (74 + 60 lessons = 134 total)
- Videos accessible via `videoUrl` field

---

## 9. Key Files Summary

| File | Purpose | Status | Notes |
|---|---|---|---|
| **App.tsx** | Entry point, routing, state | ✅ Complete | 160+ lines, defines view types |
| **types.ts** | Domain types | ✅ Complete | Course, CurricularUnit, Playlist, FilterState |
| **catalogSource.ts** | Data gateway | ⚠️ Needs fix | Hardcoded credentials, no error fallback |
| **vite.config.ts** | Vite config | ✅ Complete | Proxy configured correctly |
| **.env.local** | Environment | ✅ Set | `VITE_DATA_SOURCE=odoo` ✓ |
| **LessonDetail.tsx** | Video player | ✅ Complete | All 3 video states implemented |
| **data/*.ts** | Mock data | ✅ Complete | DEGREES, COURSE_UNITS, PLAYLISTS |
| **tests/e2e/* .spec.ts** | E2E tests | ✅ Ready | 27 tests, graceful mock fallback |

---

## 10. Recommended Next Steps (Priority Order)

### 🔴 Critical (Blockers)
1. **Replace hardcoded credentials** with environment variables
2. **Implement backend API proxy** (Node.js/Express) to fix session issue
3. **Add error fallback** to use mock data if Odoo fetch fails

### 🟡 Important
4. **Replace name-based ID mapping** with Odoo custom field `x_facodi_course_id`
5. **Replace category inference** with Odoo custom field `x_facodi_category`
6. **Add console.warn** in error handlers for debugging

### 🟢 Nice-to-Have
7. Unit tests for `catalogSource.ts` mapping functions
8. Add load testing to validate Odoo instance can handle 2000+ slide.slide records
9. Create Postman collection for API gate validation

---

## 11. File Quick Reference

| Task | File |
|---|---|
| See all routes | [App.tsx](App.tsx) |
| Change data source | [.env.local](.env.local) |
| Understand Odoo calls | [services/catalogSource.ts](services/catalogSource.ts) |
| See domain types | [types.ts](types.ts) |
| See mock data | [data/courses.ts](data/courses.ts), [data/degrees.ts](data/degrees.ts) |
| See video rendering | [components/LessonDetail.tsx](components/LessonDetail.tsx) |
| Run E2E tests | `npm run test:e2e` |
| Dev mode (Vite proxy) | `npm run dev` |
