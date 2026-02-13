alter table public.projects 
add column if not exists price text,
add column if not exists estimated_price text;
