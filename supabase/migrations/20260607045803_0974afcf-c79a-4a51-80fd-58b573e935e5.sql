
-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated insert notifications" ON public.notifications;
CREATE POLICY "Authenticated insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify on booking insert + status change to approved
CREATE OR REPLACE FUNCTION public.booking_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, message, link)
    VALUES (NEW.user_id,
      'Your event plan has been successfully received and is currently under review by our admin team.',
      '/my-bookings');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.workflow_status = 'approved' AND COALESCE(OLD.workflow_status,'') <> 'approved' THEN
      INSERT INTO public.notifications (user_id, message, link)
      VALUES (NEW.user_id,
        'Great news! Your event plan has been approved by the admin team.',
        '/my-bookings');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_notify_ins ON public.bookings;
CREATE TRIGGER trg_booking_notify_ins
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.booking_notify();

DROP TRIGGER IF EXISTS trg_booking_notify_upd ON public.bookings;
CREATE TRIGGER trg_booking_notify_upd
  AFTER UPDATE OF workflow_status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.booking_notify();

-- Allow pending_review to bypass the booking conflict check
CREATE OR REPLACE FUNCTION public.prevent_booking_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_date IS NULL THEN RETURN NEW; END IF;
  IF NEW.workflow_status IN ('completed','cancelled','pending_review','inquiry') THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'superadmin') THEN RETURN NEW; END IF;
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.venue_id = NEW.venue_id
      AND b.event_date = NEW.event_date
      AND b.id <> COALESCE(NEW.id, gen_random_uuid())
      AND b.workflow_status NOT IN ('completed','cancelled','pending_review')
  ) THEN
    RAISE EXCEPTION 'Venue already booked on % for this date', NEW.event_date;
  END IF;
  RETURN NEW;
END; $$;
