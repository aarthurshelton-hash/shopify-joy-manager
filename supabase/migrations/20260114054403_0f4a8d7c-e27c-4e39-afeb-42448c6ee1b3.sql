-- Create storage bucket for print order images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'print-images', 
  'print-images', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read print images (needed for Printify to fetch)
CREATE POLICY "Print images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'print-images');

-- Allow authenticated users to upload print images
CREATE POLICY "Authenticated users can upload print images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'print-images' AND auth.uid() IS NOT NULL);

-- Allow anon users to upload (for guest checkout)
CREATE POLICY "Anonymous users can upload print images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'print-images');