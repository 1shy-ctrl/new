-- SAMPLE roster so you can test registration locally.
-- Replace with the real list of active CICT Student IDs (Table Editor -> enrolled_students -> Import CSV).
insert into public.enrolled_students (student_id) values
  ('TCU-0000-0001'),
  ('TCU-0000-0002'),
  ('TCU-0000-0003')
on conflict do nothing;m
