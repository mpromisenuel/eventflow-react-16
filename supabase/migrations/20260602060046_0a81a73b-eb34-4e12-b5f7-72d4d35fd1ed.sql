-- Update handle_new_user to auto-grant superadmin for the hardcoded email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);

  IF NEW.email = 'mpromisenuel@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin')
      ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill superadmin for the hardcoded email if account already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role FROM auth.users
WHERE email = 'mpromisenuel@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email = 'mpromisenuel@gmail.com'
ON CONFLICT DO NOTHING;

-- Allow superadmin to bypass booking conflicts
CREATE OR REPLACE FUNCTION public.prevent_booking_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.event_date IS NULL THEN RETURN NEW; END IF;
  IF NEW.workflow_status IN ('completed','cancelled') THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'superadmin') THEN RETURN NEW; END IF;
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.venue_id = NEW.venue_id
      AND b.event_date = NEW.event_date
      AND b.id <> COALESCE(NEW.id, gen_random_uuid())
      AND b.workflow_status NOT IN ('completed','cancelled')
  ) THEN
    RAISE EXCEPTION 'Venue already booked on % for this date', NEW.event_date;
  END IF;
  RETURN NEW;
END; $$;

-- Superadmin override RLS policies
DROP POLICY IF EXISTS "Superadmin manages bookings" ON public.bookings;
CREATE POLICY "Superadmin manages bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Superadmin manages venues" ON public.venues;
CREATE POLICY "Superadmin manages venues" ON public.venues
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Superadmin manages roles" ON public.user_roles;
CREATE POLICY "Superadmin manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
