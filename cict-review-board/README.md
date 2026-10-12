# CICT Collaborative Review Board and Resource Hub

Next.js (App Router) + Tailwind CSS + Supabase (Postgres, Auth, Storage), deployed on Vercel.

## 1. Supabase setup

1. Create a project at supabase.com.
2. **SQL Editor**: run `supabase/migrations/0001_init.sql`. This creates the tables, triggers, RLS policies and the private `resources` storage bucket.
3. **Authentication > Providers > Email**: turn **off** "Confirm email". Student IDs are mapped to
   synthetic emails (`<student-id>@<NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN>`), so no mail can be delivered.
4. **Enrollment roster**: add the real active CICT Student IDs to `enrolled_students`
   (Table Editor > Import CSV). For local testing you can run `supabase/seed.sql`.
5. Copy the project URL and anon/publishable key from **Project Settings > API**.

## 2. Run locally

```bash
cp .env.local.example .env.local   # fill in the three values
npm install
npm run dev
```

Open http://localhost:3000 and register with a Student ID that is on the roster.

## 3. Deploy to Vercel

Import the repo, add the same three environment variables, and deploy. Then add your Vercel URL under
Supabase **Authentication > URL Configuration > Site URL**.

## Tighten before launch

- `src/lib/constants.ts`: `STUDENT_ID_PATTERN` is deliberately loose. Match it to the real TCU ID format.
- Registration only proves that a Student ID is on the roster, not that the person owns it. Anyone who knows an
  ID can register it first. If that matters, add a second factor to `enrolled_students` (for example a
  registration code handed out in class) and check it inside `handle_new_user()`.

## Structure

```
supabase/migrations/0001_init.sql   schema, triggers, RLS, storage bucket
src/middleware.ts                   session refresh + route protection
src/lib/supabase/                   browser, server and middleware clients
src/app/(auth)/                     login, register, server actions
src/app/(app)/dashboard/            curriculum-filtered feed
src/app/(app)/resources/new/        upload (browser -> Supabase Storage)
src/app/(app)/resources/[id]/       PDF / Markdown / code preview + voting
src/components/                     FilterBar, VoteButtons, UploadForm, ...
```
