ALTER TABLE lotes
ADD COLUMN IF NOT EXISTS auction_prices JSONB DEFAULT '[]'::jsonb;
