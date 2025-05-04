-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    bill_date TIMESTAMP WITH TIME ZONE NOT NULL,
    image_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS bills_user_id_idx ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS bills_status_idx ON public.bills(status);
CREATE INDEX IF NOT EXISTS bills_due_date_idx ON public.bills(due_date);

-- Enable Row Level Security
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own bills
CREATE POLICY "Users can view their own bills"
    ON public.bills
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own bills
CREATE POLICY "Users can insert their own bills"
    ON public.bills
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own bills
CREATE POLICY "Users can update their own bills"
    ON public.bills
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own bills
CREATE POLICY "Users can delete their own bills"
    ON public.bills
    FOR DELETE
    USING (auth.uid() = user_id); 