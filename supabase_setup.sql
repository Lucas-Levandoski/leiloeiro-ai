-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create projects table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  edital_url text,
  municipal_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security) - Optional but recommended
alter table public.projects enable row level security;

-- Create policy to allow all operations for now (or customize as needed)
create policy "Allow all operations for public" on public.projects
  for all using (true) with check (true);

-- Create storage bucket for files
insert into storage.buckets (id, name, public) values ('project-files', 'project-files', true);

-- Create policy to allow public access to files
create policy "Public Access" on storage.objects
  for select using ( bucket_id = 'project-files' );

create policy "Public Upload" on storage.objects
  for insert with check ( bucket_id = 'project-files' );

create policy "Public Update" on storage.objects
  for update with check ( bucket_id = 'project-files' );

create policy "Public Delete" on storage.objects
  for delete using ( bucket_id = 'project-files' );
