# FACODI Supabase Backend Integration Guide

**Last Updated:** April 19, 2026  
**Status:** Setup Validation Ready

---

## 1. Overview

FACODI uses **Supabase** (PostgreSQL + Auth + Realtime) as the backend foundation for:

- **Video Lesson Metadata** - Course structure, modules, lessons (YouTube links, not files)
- **User Authentication** - Email/password, OAuth providers
- **User Progress Tracking** - Which lessons completed, progress percentage
- **Playlists & Organization** - Curated playlists linking external materials

### Key Principle

> **Videos are NOT stored in Supabase.**  
> Only metadata (title, description, YouTube URL, duration) is stored.  
> This reduces costs and keeps FACODI lightweight and scalable.

---

## 2. Architecture

### Database Schema: `facodi`

All FACODI data lives in a **single PostgreSQL schema** named `facodi`.

```
supabase.com
  └─ facodi project
     └─ postgres
        ├─ public (Supabase system)
        ├─ auth (Supabase system)
        └─ facodi (← FACODI data only)
           ├─ courses
           ├─ modules
           ├─ lessons
           ├─ users
           ├─ user_progress
           ├─ playlists
           └─ playlist_items
```

### Data Model

```
courses (1) ──── (many) modules (1) ──── (many) lessons
  │                                          │
  │─ id (uuid)                            │─ id (uuid)
  │─ title                               │─ title
  │─ description                         │─ video_url (YouTube)
  │─ category                            │─ duration_seconds
  │─ level                               │─ is_preview (boolean)

users (1) ──── (many) user_progress (many) ──── lessons
  │─ id (references auth.users)          │─ completed
  │─ name                                │─ progress_percentage
  │─ email

playlists (1) ──── (many) playlist_items (many) ──── lessons
  │─ title                               │─ order_index
  │─ source (youtube/external)           │─ lesson_id
```

---

## 3. Setup Instructions

### Step 1: Get Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (free tier available)
3. Copy credentials:
   - **Project URL**: `https://[project-id].supabase.co`
   - **Anon Key**: `eyJhbGc...` (for client-side)
   - **Service Role Key**: `sbp_xxxx...` (for server-side)

### Step 2: Add Environment Variables

Create/update `.env.local`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=sbp_xxxx...
```

### Step 3: Run Validation Script

```bash
cd workspace/backend
pip install supabase requests
python scripts/supabase_setup.py
```

This will:
- ✓ Test connection
- ✓ Validate schema
- ✓ Inspect existing tables
- ✓ Report what needs to be created

### Step 4: Create Tables (if needed)

If tables don't exist, the script will output SQL.

**In Supabase Dashboard:**
1. Go to SQL Editor
2. Copy-paste the SQL from script output (Section 7)
3. Execute each statement

Or use psql directly:

```bash
psql postgresql://[user]:[pass]@[project].supabase.co:5432/postgres \
  --command "CREATE SCHEMA IF NOT EXISTS facodi;"
# Then run remaining SQL statements
```

### Step 5: Enable Security

In Supabase Dashboard → SQL Editor:

```sql
-- Enable Row Level Security (RLS)
ALTER TABLE facodi.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.playlist_items ENABLE ROW LEVEL SECURITY;

-- Public read access (courses/modules/lessons viewable by all)
CREATE POLICY "Courses readable by all" 
    ON facodi.courses FOR SELECT USING (true);

CREATE POLICY "Modules readable by all" 
    ON facodi.modules FOR SELECT USING (true);

CREATE POLICY "Lessons readable by all" 
    ON facodi.lessons FOR SELECT USING (true);

-- User progress: users can only see their own
CREATE POLICY "Users see own progress"
    ON facodi.user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own progress"
    ON facodi.user_progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own progress"
    ON facodi.user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

---

## 4. Core Tables

### courses

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| title | text | Course name (e.g., "Calculus 101") |
| description | text | Long description |
| category | text | e.g., "Mathematics", "Science" |
| level | text | beginner, intermediate, advanced |
| created_at | timestamp | Auto-set |
| updated_at | timestamp | Auto-update |

**Example:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Calculus I",
  "description": "Introduction to differential and integral calculus",
  "category": "Mathematics",
  "level": "intermediate",
  "created_at": "2026-04-19T10:00:00Z"
}
```

### modules

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| course_id | uuid | Foreign key to courses |
| title | text | Module name (e.g., "Limits & Continuity") |
| order_index | integer | Position in course |
| created_at | timestamp | Auto-set |
| updated_at | timestamp | Auto-update |

**Example:**
```json
{
  "id": "234f5678-e89b-12d3-a456-426614174111",
  "course_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Limits and Continuity",
  "order_index": 1,
  "created_at": "2026-04-19T10:00:00Z"
}
```

### lessons

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| module_id | uuid | Foreign key to modules |
| title | text | Lesson title |
| description | text | Lesson summary |
| video_url | text | YouTube URL or external link |
| duration_seconds | integer | Video length in seconds |
| order_index | integer | Position in module |
| is_preview | boolean | Free preview (true) or enrolled only (false) |
| created_at | timestamp | Auto-set |
| updated_at | timestamp | Auto-update |

**Example:**
```json
{
  "id": "345g6789-e89b-12d3-a456-426614174222",
  "module_id": "234f5678-e89b-12d3-a456-426614174111",
  "title": "What is a Limit?",
  "description": "Understanding limits as a foundation concept",
  "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "duration_seconds": 1245,
  "order_index": 1,
  "is_preview": true,
  "created_at": "2026-04-19T10:00:00Z"
}
```

### users

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | References auth.users(id) |
| email | text | User email |
| name | text | Display name |
| created_at | timestamp | Auto-set |
| updated_at | timestamp | Auto-update |

**Note:** `id` is a foreign key to `auth.users`. When a user signs up, they're created in `auth.users` first, then a profile record here.

### user_progress

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| lesson_id | uuid | Foreign key to lessons |
| completed | boolean | Lesson finished? |
| progress_percentage | integer | 0-100 (video watched %) |
| updated_at | timestamp | Last progress update |

**Example:**
```json
{
  "id": "456h7890-e89b-12d3-a456-426614174333",
  "user_id": "567i8901-e89b-12d3-a456-426614174444",
  "lesson_id": "345g6789-e89b-12d3-a456-426614174222",
  "completed": true,
  "progress_percentage": 100,
  "updated_at": "2026-04-19T14:30:00Z"
}
```

### playlists

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| title | text | Playlist name |
| source | text | 'youtube', 'external', 'internal' |
| url | text | Link to playlist (if external) |
| created_at | timestamp | Auto-set |
| updated_at | timestamp | Auto-update |

**Example:**
```json
{
  "id": "678j9012-e89b-12d3-a456-426614174555",
  "title": "MIT Calculus Lectures",
  "source": "youtube",
  "url": "https://www.youtube.com/playlist?list=...",
  "created_at": "2026-04-19T10:00:00Z"
}
```

### playlist_items

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| playlist_id | uuid | Foreign key to playlists |
| lesson_id | uuid | Foreign key to lessons |
| order_index | integer | Position in playlist |
| created_at | timestamp | Auto-set |

---

## 5. API Clients & Usage

### Python (supabase-py)

```python
from supabase import create_client

# Initialize
supabase = create_client(
    url="https://your-project.supabase.co",
    key="sbp_xxxx...SERVICE_ROLE_KEY"  # or ANON_KEY for client-side
)

# Fetch all courses
response = supabase.table("facodi.courses").select("*").execute()
courses = response.data

# Fetch course with modules and lessons
response = supabase.table("facodi.courses").select(
    "*, modules(*, lessons(*))"
).eq("id", course_id).single().execute()

# Update user progress
supabase.table("facodi.user_progress").upsert({
    "user_id": user_id,
    "lesson_id": lesson_id,
    "progress_percentage": 75,
    "completed": False
}).execute()
```

### JavaScript (supabase-js)

```javascript
import { createClient } from '@supabase/supabase-js'

// Initialize
const supabase = createClient(
  'https://your-project.supabase.co',
  'sbp_xxxx...SERVICE_ROLE_KEY'
)

// Fetch courses
const { data, error } = await supabase
  .from('facodi.courses')
  .select('*')

// Fetch course with nested data
const { data, error } = await supabase
  .from('facodi.courses')
  .select(`
    *,
    modules (
      *,
      lessons (*)
    )
  `)
  .eq('id', courseId)
  .single()

// Update progress (as authenticated user)
const { error } = await supabase
  .from('facodi.user_progress')
  .upsert({
    user_id: userId,
    lesson_id: lessonId,
    progress_percentage: 75,
    completed: false
  })
```

### HTTP REST API

```bash
# Fetch courses
curl -X GET 'https://your-project.supabase.co/rest/v1/facodi.courses?select=*' \
  -H 'Authorization: Bearer sbp_xxxx...' \
  -H 'apikey: sbp_xxxx...'

# Fetch with join
curl -X GET 'https://your-project.supabase.co/rest/v1/facodi.courses?select=*,modules(*,lessons(*))' \
  -H 'Authorization: Bearer sbp_xxxx...'

# Upsert progress
curl -X POST 'https://your-project.supabase.co/rest/v1/facodi.user_progress' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sbp_xxxx...' \
  -d '{
    "user_id": "uuid",
    "lesson_id": "uuid",
    "progress_percentage": 75,
    "completed": false
  }'
```

---

## 6. Authentication

### Setup (Supabase Dashboard)

1. **Authentication → Settings**
   - Enable: Email/Password (required)
   - Optionally: Google, GitHub OAuth

2. **Email Configuration**
   - Confirm email required: Yes (recommended)
   - Email: Auto (Supabase default) or custom SMTP

3. **URL Redirect**
   - Set redirect URL for frontend:
     - Dev: `http://localhost:3000/auth/callback`
     - Prod: `https://facodi.pt/auth/callback`

### Usage

**Sign Up:**
```python
# In your backend
response = supabase.auth.sign_up({
    "email": "user@example.com",
    "password": "SecurePassword123!"
})
user = response.user
```

**Sign In:**
```python
response = supabase.auth.sign_in_with_password({
    "email": "user@example.com",
    "password": "SecurePassword123!"
})
session = response.session
```

**Get Current User:**
```python
response = supabase.auth.get_user(jwt=token)
user = response.user
```

---

## 7. Security Best Practices

### Row Level Security (RLS)

✅ **ALWAYS enabled:**
- Public content (courses, modules, lessons): readable by all
- User data (progress, profile): readable only by owner
- Write operations: require authentication

### API Keys

| Key | Use Case | Exposure |
|-----|----------|----------|
| ANON_KEY | Frontend, React, public clients | ✓ Exposed to browser |
| SERVICE_ROLE_KEY | Backend, admin operations | ✗ Never expose to frontend |

### Environment Variables

```bash
# Frontend (.env, exposed to browser)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Backend .env.local (git-ignored)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### JWT & Sessions

- Supabase generates short-lived JWTs (1 hour default)
- Refresh tokens are used to get new JWTs
- Store refresh token in httpOnly cookie (secure)
- Validate JWT on backend before trusting claims

---

## 8. Migrations & Schema Updates

When you need to modify the schema:

### Option 1: Supabase Dashboard (Quick Changes)

1. Go to SQL Editor
2. Write and test SQL
3. Execute directly

### Option 2: Migrations (Recommended for Production)

```bash
# Create migration
supabase migration new add_course_tags

# Edit migration file in supabase/migrations/
# Then apply locally:
supabase db push

# When committed to repo, CI/CD applies to production
```

### Example Migration

```sql
-- Add tags column to courses
ALTER TABLE facodi.courses ADD COLUMN tags TEXT[];

-- Update existing records
UPDATE facodi.courses SET tags = ARRAY[]::text[];

-- Make it NOT NULL  
ALTER TABLE facodi.courses ALTER COLUMN tags SET NOT NULL;

-- Create index for fast filtering
CREATE INDEX idx_courses_tags ON facodi.courses USING GIN (tags);
```

---

## 9. Performance Optimization

### Indexes

Already created in base schema:
- `idx_modules_course` - Fast module lookups per course
- `idx_lessons_module` - Fast lesson lookups per module
- `idx_user_progress_user` - Fast progress lookups per user
- `idx_user_progress_lesson` - Fast progress lookups per lesson

### Query Optimization

**Good (with index):**
```sql
SELECT * FROM facodi.lessons WHERE module_id = '123';  -- Uses idx_lessons_module
```

**Poor (full table scan):**
```sql
SELECT * FROM facodi.lessons WHERE video_url LIKE '%youtube%';  -- No index
```

### Pagination

Always use LIMIT and OFFSET for large result sets:

```python
# Fetch 20 courses per page
page = 0
limit = 20
offset = page * limit

response = supabase.table("facodi.courses").select("*").range(offset, offset + limit - 1).execute()
```

---

## 10. Monitoring & Reliability

### Backups

Supabase includes daily automated backups (7-day retention on free tier).

**Access backups:**
1. Supabase Dashboard → Database → Backups
2. Download or restore to point-in-time

### Performance Monitoring

Supabase Dashboard → Database → Queries & Performance

Monitor:
- Slow queries (> 100ms)
- High lock contention
- Connection usage

### Error Tracking

Supabase Dashboard → Logs → Functions & Webhooks

---

## 11. Scaling Considerations

### Pro Tier Features (When Needed)

- **Higher compute** - Larger instances for > 10K concurrent users
- **Point-in-time recovery** - Retain backups for 30+ days
- **Custom domain** - Optional for branding
- **Priority support**

### Optimization Checklist

- [ ] Add indexes for common filters
- [ ] Use read-only replicas for reports
- [ ] Archive old user_progress records (> 1 year)
- [ ] Cache frequently accessed data in Redis
- [ ] Monitor query performance monthly

---

## 12. Next Steps

### Immediate (Week 1)

- [ ] Create Supabase project
- [ ] Set environment variables
- [ ] Run `supabase_setup.py` validation
- [ ] Create tables via SQL Editor
- [ ] Enable RLS and policies
- [ ] Test connection with sample queries

### Short Term (Week 2-3)

- [ ] Integrate auth in frontend
- [ ] Create user signup/login flows
- [ ] Build course listing page (queries)
- [ ] Build lesson playback page
- [ ] Implement progress tracking

### Medium Term (Month 2)

- [ ] Add realtime progress updates
- [ ] Build admin dashboard (course management)
- [ ] Set up CI/CD for migrations
- [ ] Performance test with sample data
- [ ] Plan scalability strategy

---

## 13. Troubleshooting

### "Connection refused"

```bash
# Check Supabase is online
curl -I https://your-project.supabase.co/auth/v1/user

# Verify credentials in .env.local
env | grep SUPABASE
```

### "Schema not found"

```bash
# Create schema (in Supabase SQL Editor)
CREATE SCHEMA IF NOT EXISTS facodi;
GRANT USAGE ON SCHEMA facodi TO authenticated, anon;
```

### "Table does not exist"

```bash
# Run validation script to check
python workspace/backend/scripts/supabase_setup.py

# Execute missing table SQL from script output
```

### "Permission denied"

Check RLS policies:
1. Supabase Dashboard → Policies
2. Verify policies match your access model
3. Check GRANT statements for roles (authenticated, anon)

---

## 14. References

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Authentication Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Client Libraries](https://supabase.com/docs/reference/javascript/introduction)

---

**Document Version:** 1.0  
**Last Updated:** April 19, 2026  
**Status:** Ready for Implementation
