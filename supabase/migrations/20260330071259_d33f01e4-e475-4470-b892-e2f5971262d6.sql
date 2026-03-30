
-- Create venue_type enum
CREATE TYPE public.venue_type AS ENUM ('hall', 'beach', 'grounds', 'rooftop', 'garden', 'ballroom');

-- Create event_category enum
CREATE TYPE public.event_category AS ENUM ('conference', 'workshop', 'social', 'networking', 'celebration');

-- Create market_status enum
CREATE TYPE public.market_status AS ENUM ('available', 'booked', 'sold-out');

-- Create venues table
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  category public.event_category NOT NULL DEFAULT 'social',
  max_attendees INTEGER NOT NULL DEFAULT 100,
  image TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'upcoming',
  likes INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,1) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  venue_type public.venue_type NOT NULL DEFAULT 'hall',
  property_ref TEXT,
  agent_name TEXT,
  agent_phone TEXT,
  agent_website TEXT,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  inclusions TEXT[] NOT NULL DEFAULT '{}',
  extra_fees TEXT[] NOT NULL DEFAULT '{}',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  map_url TEXT,
  market_status public.market_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(venue_id)
);

-- Enable RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Venues policies: anyone can read, authenticated users can insert their own, owners can update/delete
CREATE POLICY "Anyone can view venues" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create venues" ON public.venues FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update their venues" ON public.venues FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can delete their venues" ON public.venues FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Bookings policies: anyone can see bookings, authenticated can book
CREATE POLICY "Anyone can view bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can book" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Update venue market_status when booked via trigger
CREATE OR REPLACE FUNCTION public.mark_venue_booked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.venues SET market_status = 'booked', updated_at = now() WHERE id = NEW.venue_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_venue_booked();
