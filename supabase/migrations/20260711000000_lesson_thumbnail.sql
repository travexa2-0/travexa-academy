-- Per-lesson cover image, independent from the course thumbnail.
-- Optional: UIs fall back to academy_courses.thumbnail_url when null.
alter table academy_lessons
  add column if not exists thumbnail_url text;
