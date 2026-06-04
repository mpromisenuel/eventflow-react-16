
-- Update superadmin email to Davitorlele@gmail.com (case-insensitive)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);

  IF lower(NEW.email) = lower('Davitorlele@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin')
      ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- If the user already exists, grant superadmin + admin roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role FROM auth.users WHERE lower(email) = lower('Davitorlele@gmail.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = lower('Davitorlele@gmail.com')
ON CONFLICT DO NOTHING;
