-- Create enum for listing status
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'cancelled');

-- Create marketplace listings table
CREATE TABLE public.visualization_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visualization_id UUID NOT NULL REFERENCES public.saved_visualizations(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0, -- 0 = free gift
  status public.listing_status NOT NULL DEFAULT 'active',
  buyer_id UUID,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sold_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure only one active listing per visualization
  CONSTRAINT unique_active_listing UNIQUE (visualization_id, status)
);

-- Enable RLS
ALTER TABLE public.visualization_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings (public marketplace)
CREATE POLICY "Anyone can view active listings"
ON public.visualization_listings
FOR SELECT
USING (status = 'active');

-- Sellers can view their own listings (any status)
CREATE POLICY "Sellers can view their own listings"
ON public.visualization_listings
FOR SELECT
USING (auth.uid() = seller_id);

-- Buyers can view their purchased listings
CREATE POLICY "Buyers can view their purchases"
ON public.visualization_listings
FOR SELECT
USING (auth.uid() = buyer_id);

-- Premium users can create listings for their own visualizations
CREATE POLICY "Users can create listings for their visualizations"
ON public.visualization_listings
FOR INSERT
WITH CHECK (
  auth.uid() = seller_id AND
  EXISTS (
    SELECT 1 FROM public.saved_visualizations
    WHERE id = visualization_id AND user_id = auth.uid()
  )
);

-- Sellers can update their active listings (cancel, change price)
CREATE POLICY "Sellers can update their listings"
ON public.visualization_listings
FOR UPDATE
USING (auth.uid() = seller_id AND status = 'active');

-- Sellers can delete their active listings
CREATE POLICY "Sellers can delete their listings"
ON public.visualization_listings
FOR DELETE
USING (auth.uid() = seller_id AND status = 'active');

-- Trigger for updated_at
CREATE TRIGGER update_visualization_listings_updated_at
BEFORE UPDATE ON public.visualization_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();