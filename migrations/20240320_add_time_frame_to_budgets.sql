-- Make month and year columns nullable
ALTER TABLE budgets
ALTER COLUMN month DROP NOT NULL,
ALTER COLUMN year DROP NOT NULL;

-- Update existing records to have monthly time frame if not set
UPDATE budgets
SET time_frame = 'monthly'
WHERE time_frame IS NULL; 