# FACODI Supabase Quick Reference

**For rapid lookup of common tasks and commands**

---

## 1. Quick Setup (5 min)

### Get Credentials
1. Go to [supabase.com](https://supabase.com)
2. Create project → Copy Project URL
3. Settings → API → Copy Service Role Key
4. Add to `.env.local`:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sbp_xxxx...
   ```

### Validate Connection
```bash
cd workspace/backend
pip install supabase requests
python scripts/supabase_setup.py
```

---

## 2. Database Commands

### List All Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'facodi';
```

### View Table Structure
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'courses' AND table_schema = 'facodi';
```

### Query Data
```sql
-- All courses
SELECT * FROM facodi.courses;

-- Course with nested data
SELECT * FROM facodi.courses, facodi.modules m 
WHERE m.course_id = courses.id 
ORDER BY m.order_index;

-- User progress
SELECT * FROM facodi.user_progress WHERE user_id = 'user-id-here';
```

### Insert Data
```sql
-- New course
INSERT INTO facodi.courses (title, description, category, level)
VALUES ('Calculus 101', 'Introduction to calculus', 'Math', 'beginner');

-- New lesson
INSERT INTO facodi.lessons (module_id, title, video_url, duration_seconds, order_index)
VALUES ('module-uuid', 'Lesson Title', 'https://youtube.com/...', 1245, 1);
```

### Update Data
```sql
-- Update course
UPDATE facodi.courses SET title = 'Advanced Calculus' WHERE id = 'course-id';

-- Update user progress
UPDATE facodi.user_progress 
SET progress_percentage = 75, completed = true 
WHERE user_id = 'user-id' AND lesson_id = 'lesson-id';
```

---

## 3. Python Client Quick Start

### Initialize
```python
from supabase import create_client

supabase = create_client(
    "https://your-project.supabase.co",
    "sbp_SERVICE_ROLE_KEY"
)
```

### Select/Query
```python
# All courses
response = supabase.table("facodi.courses").select("*").execute()

# With filter
response = supabase.table("facodi.courses").select("*").eq("category", "Math").execute()

# With join
response = supabase.table("facodi.courses").select(
    "*, modules(*, lessons(*))"
).execute()

# Single record
response = supabase.table("facodi.courses").select("*").eq("id", course_id).single().execute()

# Get data
courses = response.data
```

### Insert
```python
new_course = {
    "title": "Calculus 101",
    "description": "Intro to calculus",
    "category": "Math",
    "level": "beginner"
}

response = supabase.table("facodi.courses").insert(new_course).execute()
course_id = response.data[0]["id"]
```

### Update
```python
update_data = {"title": "Advanced Calculus"}

response = supabase.table("facodi.courses").update(update_data).eq("id", course_id).execute()
```

### Upsert (Insert or Update)
```python
progress = {
    "user_id": user_id,
    "lesson_id": lesson_id,
    "progress_percentage": 75,
    "completed": False
}

response = supabase.table("facodi.user_progress").upsert(progress).execute()
```

### Delete
```python
response = supabase.table("facodi.courses").delete().eq("id", course_id).execute()
```

---

## 4. JavaScript Client Quick Start

### Initialize
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'ANON_KEY_FOR_FRONTEND'
)
```

### Select/Query
```javascript
// All courses
const { data, error } = await supabase
  .from('facodi.courses')
  .select('*')

// With filter
const { data } = await supabase
  .from('facodi.courses')
  .select('*')
  .eq('category', 'Math')

// With join
const { data } = await supabase
  .from('facodi.courses')
  .select(`
    *,
    modules (
      *,
      lessons (*)
    )
  `)
```

### Insert
```javascript
const { data, error } = await supabase
  .from('facodi.courses')
  .insert([
    { title: 'Calculus 101', category: 'Math', level: 'beginner' }
  ])
```

### Update
```javascript
const { data, error } = await supabase
  .from('facodi.courses')
  .update({ title: 'Advanced Calculus' })
  .eq('id', courseId)
```

### Upsert
```javascript
const { data, error } = await supabase
  .from('facodi.user_progress')
  .upsert({
    user_id: userId,
    lesson_id: lessonId,
    progress_percentage: 75,
    completed: false
  })
```

---

## 5. Authentication Quick Reference

### Sign Up
```python
response = supabase.auth.sign_up({
    "email": "user@example.com",
    "password": "SecurePassword123!"
})
user = response.user
```

### Sign In
```python
response = supabase.auth.sign_in_with_password({
    "email": "user@example.com",
    "password": "SecurePassword123!"
})
session = response.session
token = session.access_token
```

### Get Current User
```python
response = supabase.auth.get_user(jwt=token)
user = response.user
```

### Sign Out
```python
supabase.auth.sign_out()
```

### Refresh Session
```python
response = supabase.auth.refresh_session(refresh_token)
new_token = response.session.access_token
```

---

## 6. RLS (Row Level Security) Quick Reference

### Enable RLS
```sql
ALTER TABLE facodi.courses ENABLE ROW LEVEL SECURITY;
```

### Public Read Policy (Everyone can read)
```sql
CREATE POLICY "courses_readable" 
    ON facodi.courses FOR SELECT 
    USING (true);
```

### User-Owned Data Policy
```sql
CREATE POLICY "user_can_read_own_progress"
    ON facodi.user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "user_can_update_own_progress"
    ON facodi.user_progress FOR UPDATE
    USING (auth.uid() = user_id);
```

### Admin-Only Policy
```sql
CREATE POLICY "admins_can_modify_courses"
    ON facodi.courses FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 7. Common Queries

### Get Course with All Content
```sql
SELECT 
    c.id,
    c.title,
    c.description,
    json_agg(json_build_object(
        'id', m.id,
        'title', m.title,
        'lessons', (
            SELECT json_agg(
                json_build_object(
                    'id', l.id,
                    'title', l.title,
                    'video_url', l.video_url,
                    'duration', l.duration_seconds
                )
                ORDER BY l.order_index
            )
            FROM facodi.lessons l
            WHERE l.module_id = m.id
        )
    ) ORDER BY m.order_index)
FROM facodi.courses c
LEFT JOIN facodi.modules m ON m.course_id = c.id
WHERE c.id = 'course-id'
GROUP BY c.id;
```

### Get User's Course Progress
```sql
SELECT 
    c.title as course_title,
    COUNT(CASE WHEN up.completed THEN 1 END) as lessons_completed,
    COUNT(l.id) as lessons_total,
    ROUND(100.0 * COUNT(CASE WHEN up.completed THEN 1 END) / COUNT(l.id)) as progress_percentage
FROM facodi.courses c
LEFT JOIN facodi.modules m ON m.course_id = c.id
LEFT JOIN facodi.lessons l ON l.module_id = m.id
LEFT JOIN facodi.user_progress up ON up.lesson_id = l.id AND up.user_id = 'user-id'
GROUP BY c.id;
```

### Which Lessons Need Content
```sql
SELECT l.id, l.title, l.video_url, l.duration_seconds
FROM facodi.lessons l
WHERE l.video_url IS NULL OR l.duration_seconds IS NULL
ORDER BY l.created_at DESC;
```

---

## 8. Useful Links

| Resource | URL |
|----------|-----|
| **Supabase Dashboard** | https://app.supabase.com |
| **Docs** | https://supabase.com/docs |
| **Python Client** | https://github.com/supabase/supabase-py |
| **JavaScript Client** | https://github.com/supabase/supabase-js |
| **SQL Editor** | supabase.com → Project → SQL Editor |
| **Authentication** | supabase.com → Project → Authentication |
| **RLS Policies** | supabase.com → Project → RLS Policies |
| **Status Page** | https://status.supabase.com |

---

## 9. Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Schema not found` | `facodi` schema missing | Create in SQL Editor: `CREATE SCHEMA facodi;` |
| `Table does not exist` | Table name wrong or not created | Run `supabase_setup.py` to create tables |
| `Permission denied` | RLS policy blocks access | Check RLS policies, ensure auth token passed |
| `22P02: invalid input syntax` | Wrong data type | Check data types match schema |
| `Connection refused` | Supabase down or wrong URL | Check `.env.local`, verify supabase status |
| `JWT expired` | Token too old | Refresh token using `auth.refresh_session()` |
| `UNIQUE violation` | Duplicate record | Use UPSERT instead of INSERT |

---

## 10. Performance Tips

- ✓ Use indexes for frequently filtered columns
- ✓ Paginate large result sets (LIMIT 50)
- ✓ Use SELECT only needed columns
- ✓ Cache responses when possible (Redis)
- ✓ Monitor slow queries in Supabase dashboard
- ✗ Avoid N+1 queries - use JOINs
- ✗ Avoid large transactions
- ✗ Don't fetch entire tables repeatedly

---

## 11. Support Channels

- **Docs**: https://supabase.com/docs
- **Discord**: https://discord.gg/supabase (thousands of users)
- **Twitter**: @supabase
- **GitHub**: github.com/supabase/supabase (issues/discussions)

---

**Quick Reference Version:** 1.0  
**Last Updated:** April 19, 2026  
**Print this for quick lookup!**
