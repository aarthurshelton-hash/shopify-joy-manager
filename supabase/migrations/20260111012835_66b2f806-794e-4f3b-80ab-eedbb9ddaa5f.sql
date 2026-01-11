-- Add DELETE policy for profiles table to allow users to delete their own profile data (GDPR compliance)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Update handle_new_user function to add input validation for display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  display_name_value TEXT;
BEGIN
  -- Extract and validate display_name
  display_name_value := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    split_part(NEW.email, '@', 1)
  );
  
  -- Enforce length limit (50 characters max)
  IF LENGTH(display_name_value) > 50 THEN
    display_name_value := LEFT(display_name_value, 50);
  END IF;
  
  -- Remove control characters and null bytes
  display_name_value := REGEXP_REPLACE(display_name_value, E'[\\x00-\\x1F\\x7F]', '', 'g');
  
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, display_name_value);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;