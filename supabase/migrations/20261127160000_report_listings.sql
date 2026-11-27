-- =====================================================================
-- Report a business, organization or event (before: only people and
-- messages could be reported). The reported member is always the listing's
-- owner, filled in by the server so it can't be pointed at someone else.
-- =====================================================================
ALTER TABLE public.abuse_reports
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.business_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.org_events(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.fill_report_target()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner uuid;
BEGIN
  IF NEW.event_id IS NOT NULL THEN
    SELECT e.org_id INTO NEW.business_id FROM public.org_events e WHERE e.id = NEW.event_id;
    IF NEW.business_id IS NULL THEN RAISE EXCEPTION 'Event not found'; END IF;
  END IF;
  IF NEW.business_id IS NOT NULL THEN
    SELECT b.owner_id INTO _owner FROM public.business_accounts b WHERE b.id = NEW.business_id;
    IF _owner IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
    IF _owner = NEW.reporter_id THEN RAISE EXCEPTION 'You can''t report your own listing'; END IF;
    NEW.accused_id := _owner;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.fill_report_target() FROM PUBLIC, anon, authenticated;

-- Runs before the evidence/guard triggers (alphabetical order).
DROP TRIGGER IF EXISTS a_fill_report_target_trg ON public.abuse_reports;
CREATE TRIGGER a_fill_report_target_trg
  BEFORE INSERT ON public.abuse_reports
  FOR EACH ROW EXECUTE FUNCTION public.fill_report_target();

NOTIFY pgrst, 'reload schema';
