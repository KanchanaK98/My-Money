-- Create storage bucket for bill attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('bill-attachments', 'bill-attachments', false);

-- Set up storage policies
CREATE POLICY "Users can view their own bill attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'bill-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own bill attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'bill-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own bill attachments"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'bill-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own bill attachments"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'bill-attachments' AND auth.uid()::text = (storage.foldername(name))[1]); 