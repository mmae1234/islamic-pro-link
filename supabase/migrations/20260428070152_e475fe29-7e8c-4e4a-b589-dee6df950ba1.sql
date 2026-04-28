-- Lock down profiles.role at the GRANT layer.
-- Postgres column REVOKEs do not override a broader table-level UPDATE grant,
-- so we revoke table-level UPDATE and re-grant only the safe columns.

REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;

GRANT UPDATE (first_name, last_name, avatar_url, messaging_privacy, first_login)
  ON public.profiles TO authenticated;