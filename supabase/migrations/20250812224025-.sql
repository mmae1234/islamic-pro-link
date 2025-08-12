-- 1) Add first_login flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_login boolean NOT NULL DEFAULT true;

-- 2) Backfill: users who already have a professional profile are not first login
UPDATE public.profiles p
SET first_login = false
FROM public.professional_profiles pp
WHERE pp.user_id = p.user_id;

-- 3) Reliability: everytime a professional profile is created/updated, mark first_login=false
CREATE OR REPLACE FUNCTION public.mark_not_first_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.profiles
  SET first_login = false
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_mark_not_first_login ON public.professional_profiles;

CREATE TRIGGER trg_mark_not_first_login
AFTER INSERT OR UPDATE ON public.professional_profiles
FOR EACH ROW
EXECUTE FUNCTION public.mark_not_first_login();