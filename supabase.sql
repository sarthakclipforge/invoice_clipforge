-- Run this in your Supabase SQL Editor

-- Drop the previous table if it exists to remove the old schema with the user_id dependency
DROP TABLE IF EXISTS invoices;

-- Create the invoices table without the user_id dependency
CREATE TABLE invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text,
  client_name text,
  total_amount numeric,
  currency text,
  invoice_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Turn on Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Since this is an admin-only app behind a hardcoded login wall, 
-- we can safely allow the anon key to read/write the table.
CREATE POLICY "Allow public select" ON invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON invoices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON invoices FOR DELETE USING (true);
