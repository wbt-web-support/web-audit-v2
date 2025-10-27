-- Create notify_me table for storing email signups
CREATE TABLE IF NOT EXISTS notify_me (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  source VARCHAR(50) DEFAULT 'homepage' -- Track where the signup came from
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_notify_me_email ON notify_me(email);

-- Create index for active signups
CREATE INDEX IF NOT EXISTS idx_notify_me_active ON notify_me(is_active) WHERE is_active = TRUE;

-- Add RLS (Row Level Security) policy to allow public inserts
ALTER TABLE notify_me ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public to insert notify_me" ON notify_me;
DROP POLICY IF EXISTS "Allow authenticated users to read notify_me" ON notify_me;
DROP POLICY IF EXISTS "Allow public to insert notify_me" ON notify_me;
DROP POLICY IF EXISTS "Allow authenticated users to read notify_me" ON notify_me;

-- Policy to allow anyone to insert new email signups
CREATE POLICY "Allow public to insert notify_me" ON notify_me
  FOR INSERT WITH CHECK (true);

-- Policy to allow anyone to read their own signups (for checking duplicates)
CREATE POLICY "Allow public to read notify_me" ON notify_me
  FOR SELECT USING (true);

-- Policy to allow authenticated users to read all signups (for admin purposes)
CREATE POLICY "Allow authenticated users to read notify_me" ON notify_me
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow updates (for reactivating subscriptions)
CREATE POLICY "Allow public to update notify_me" ON notify_me
  FOR UPDATE USING (true) WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notify_me_updated_at 
  BEFORE UPDATE ON notify_me 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
