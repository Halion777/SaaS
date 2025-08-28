
-- Policy to allow authenticated users to upload files
CREATE POLICY "Users can upload invoice files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoice-uploads' 
    AND auth.role() = 'authenticated'
  );

-- Policy to allow public access to files (needed for OCR processing)
CREATE POLICY "Public can view invoice files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoice-uploads'
  );

-- Policy to allow users to delete their own uploaded files
CREATE POLICY "Users can delete their own invoice files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'invoice-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy to allow edge functions to access files (for OCR processing)
CREATE POLICY "Edge functions can access invoice files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoice-uploads'
  );
