-- Block direct client writes to vision_scores (only system functions should modify)
CREATE POLICY "No direct client inserts on vision_scores" 
ON public.vision_scores 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

CREATE POLICY "No direct client updates on vision_scores" 
ON public.vision_scores 
FOR UPDATE 
TO authenticated 
USING (false);

CREATE POLICY "No direct client deletes on vision_scores" 
ON public.vision_scores 
FOR DELETE 
TO authenticated 
USING (false);

-- Admins can manage scores if needed for support/corrections
CREATE POLICY "Admins can manage vision scores" 
ON public.vision_scores 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));