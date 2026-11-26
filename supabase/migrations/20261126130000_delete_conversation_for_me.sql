-- =====================================================================
-- "Delete conversation" hides it for YOU only (logic review, Nov 25 2026)
--
-- Before: deleting removed the conversations row and soft-deleted every
-- message for BOTH people. A sender could erase abusive messages before
-- they were reported, and deleting reset the 3-message request cap and
-- the accept/decline state.
-- Now: a per-user "hidden before" marker. Messages older than it are
-- hidden from that user only; the other person keeps the thread, and the
-- conversation (with its request status and limits) stays intact.
-- New messages after the marker reappear normally.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.conversation_hides (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_before timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, partner_id)
);

ALTER TABLE public.conversation_hides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own conversation hides" ON public.conversation_hides;
CREATE POLICY "Users manage their own conversation hides"
  ON public.conversation_hides FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE ALL ON public.conversation_hides FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_hides TO authenticated;

-- Users can no longer delete the shared conversation row (it holds the
-- request status, who asked, and the message-request limits).
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

-- Single messages: "Delete" also hides it for you only.
CREATE TABLE IF NOT EXISTS public.message_hides (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  hidden_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, message_id)
);

ALTER TABLE public.message_hides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own message hides" ON public.message_hides;
CREATE POLICY "Users manage their own message hides"
  ON public.message_hides FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
  );

REVOKE ALL ON public.message_hides FROM anon;
GRANT SELECT, INSERT, DELETE ON public.message_hides TO authenticated;

-- Members can no longer erase a message for the other person, and a sender
-- can't mark their own message read or clear a report against it.
-- (Admins and server jobs are unaffected.)
CREATE OR REPLACE FUNCTION public.guard_message_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.deleted_at := OLD.deleted_at;
  NEW.archived_at := OLD.archived_at;
  IF auth.uid() IS DISTINCT FROM OLD.recipient_id THEN
    NEW.read_at := OLD.read_at;
    NEW.reported_at := OLD.reported_at;
    NEW.report_reason := OLD.report_reason;
  ELSIF OLD.reported_at IS NOT NULL THEN
    NEW.reported_at := OLD.reported_at;
    NEW.report_reason := OLD.report_reason;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_message_flags() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_message_flags_trigger ON public.messages;
CREATE TRIGGER guard_message_flags_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_message_flags();

NOTIFY pgrst, 'reload schema';
