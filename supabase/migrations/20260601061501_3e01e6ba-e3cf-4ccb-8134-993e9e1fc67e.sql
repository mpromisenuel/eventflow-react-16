
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_venue_id_key;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS guest_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_estimate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'inquiry',
  ADD COLUMN IF NOT EXISTS notes text;

DROP POLICY IF EXISTS "Owner or admin can update booking" ON public.bookings;
CREATE POLICY "Owner or admin can update booking"
ON public.bookings FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
GRANT UPDATE ON public.bookings TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_booking_conflict()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.event_date IS NULL THEN RETURN NEW; END IF;
  IF NEW.workflow_status IN ('completed','cancelled') THEN RETURN NEW; END IF;
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

DROP TRIGGER IF EXISTS booking_conflict_check ON public.bookings;
CREATE TRIGGER booking_conflict_check
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.prevent_booking_conflict();

CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  phone text, email text, website text, notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vendors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Users can add vendors" ON public.vendors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners or admins update vendors" ON public.vendors FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners or admins delete vendors" ON public.vendors FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.event_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  UNIQUE (booking_id, vendor_id)
);
GRANT SELECT ON public.event_vendors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_vendors TO authenticated;
GRANT ALL ON public.event_vendors TO service_role;
ALTER TABLE public.event_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event vendors" ON public.event_vendors FOR SELECT USING (true);
CREATE POLICY "Authenticated can link vendors" ON public.event_vendors FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator or admin can remove link" ON public.event_vendors FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.event_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_at timestamptz,
  completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_tasks TO authenticated;
GRANT ALL ON public.event_tasks TO service_role;
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tasks" ON public.event_tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated can add tasks" ON public.event_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator or admin can update tasks" ON public.event_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Creator or admin can delete tasks" ON public.event_tasks FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_event_tasks_updated_at
BEFORE UPDATE ON public.event_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
