
-- Bookings: restrict SELECT
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;
CREATE POLICY "Owner or admin can view bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Event tasks: restrict SELECT + tighten INSERT
DROP POLICY IF EXISTS "Anyone can view tasks" ON public.event_tasks;
CREATE POLICY "Booking owner or admin can view tasks" ON public.event_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')))
  );

DROP POLICY IF EXISTS "Authenticated can add tasks" ON public.event_tasks;
CREATE POLICY "Booking owner can add tasks" ON public.event_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')))
  );

-- Event vendors: restrict SELECT + tighten INSERT
DROP POLICY IF EXISTS "Anyone can view event vendors" ON public.event_vendors;
CREATE POLICY "Booking owner or admin can view event vendors" ON public.event_vendors
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')))
  );

DROP POLICY IF EXISTS "Authenticated can link vendors" ON public.event_vendors;
CREATE POLICY "Booking owner can link vendors" ON public.event_vendors
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')))
  );

-- Favorites: only owner can view
DROP POLICY IF EXISTS "Anyone can view favorites" ON public.favorites;
CREATE POLICY "Users view own favorites" ON public.favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Profiles: restrict to self + admins
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- User roles: restrict to self + admins
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Vendors: restrict contact info to authenticated only
DROP POLICY IF EXISTS "Anyone can view vendors" ON public.vendors;
CREATE POLICY "Authenticated users view vendors" ON public.vendors
  FOR SELECT TO authenticated
  USING (true);

-- Revoke public EXECUTE on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_booking_conflict() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_venue_likes_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_venue_booked() FROM PUBLIC, anon, authenticated;
