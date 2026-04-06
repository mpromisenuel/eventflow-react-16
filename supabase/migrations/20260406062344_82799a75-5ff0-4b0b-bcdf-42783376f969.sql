
-- Create user_likes table to persist per-user like status
CREATE TABLE public.user_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, venue_id)
);

ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.user_likes FOR SELECT USING (true);
CREATE POLICY "Users can add likes" ON public.user_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove likes" ON public.user_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create a function to sync venue like count
CREATE OR REPLACE FUNCTION public.update_venue_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.venues SET likes = (SELECT COUNT(*) FROM public.user_likes WHERE venue_id = NEW.venue_id) WHERE id = NEW.venue_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.venues SET likes = (SELECT COUNT(*) FROM public.user_likes WHERE venue_id = OLD.venue_id) WHERE id = OLD.venue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.user_likes
FOR EACH ROW EXECUTE FUNCTION public.update_venue_likes_count();
