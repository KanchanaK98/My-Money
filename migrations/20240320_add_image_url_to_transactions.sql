-- Add image_url column to transactions table
ALTER TABLE transactions
ADD COLUMN image_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN transactions.image_url IS 'URL of the transaction proof image stored in Supabase storage'; 