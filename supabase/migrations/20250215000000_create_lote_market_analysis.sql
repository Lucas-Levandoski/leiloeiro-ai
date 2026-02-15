-- Create a new table for market analysis results
create table if not exists lote_market_analysis (
  id uuid default gen_random_uuid() primary key,
  lote_id uuid references lotes(id) on delete cascade not null,
  title text not null,
  price text,
  url text not null,
  description text,
  source text default 'OLX',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add an index for faster lookups by lote_id
create index if not exists idx_lote_market_analysis_lote_id on lote_market_analysis(lote_id);

-- Enable RLS (Row Level Security)
alter table lote_market_analysis enable row level security;

-- Create policy to allow authenticated users to view analysis results
create policy "Allow authenticated users to view market analysis"
  on lote_market_analysis for select
  using (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert analysis results
create policy "Allow authenticated users to insert market analysis"
  on lote_market_analysis for insert
  with check (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update their analysis results
create policy "Allow authenticated users to update market analysis"
  on lote_market_analysis for update
  using (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete their analysis results
create policy "Allow authenticated users to delete market analysis"
  on lote_market_analysis for delete
  using (auth.role() = 'authenticated');
