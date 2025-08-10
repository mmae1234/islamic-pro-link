-- Re-run corrected migration with proper ordering

-- Ensure enums exist
DO $$ BEGIN
  CREATE TYPE public.business_member_role AS ENUM ('admin','editor','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.link_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure extended columns on business_accounts
ALTER TABLE public.business_accounts
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS booking_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS occupations text[],
  ADD COLUMN IF NOT EXISTS languages text[],
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- 1) Create business_members first
CREATE TABLE IF NOT EXISTS public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role public.business_member_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_members_unique UNIQUE (business_id, user_id),
  CONSTRAINT fk_business_members_business FOREIGN KEY (business_id) REFERENCES public.business_accounts(id) ON DELETE CASCADE
);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_business_members_business ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON public.business_members(user_id);

-- 2) Helper functions (now that business_members exists)
CREATE OR REPLACE FUNCTION public.is_business_owner(_user_id uuid, _business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  select exists (
    select 1 from public.business_accounts b 
    where b.id = _business_id and b.owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_team_member(_user_id uuid, _business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  select public.is_business_owner(_user_id, _business_id)
     or exists (
       select 1 from public.business_members m 
       where m.business_id = _business_id and m.user_id = _user_id
     );
$$;

CREATE OR REPLACE FUNCTION public.has_business_role(
  _user_id uuid,
  _business_id uuid,
  _roles public.business_member_role[]
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  select public.is_business_owner(_user_id, _business_id)
     or exists (
       select 1 from public.business_members m 
       where m.business_id = _business_id 
         and m.user_id = _user_id 
         and m.role = ANY(_roles)
     );
$$;

-- 3) RLS policies for business_members
DO $$ BEGIN
  DROP POLICY IF EXISTS "Team can view business members" ON public.business_members;
  CREATE POLICY "Team can view business members"
  ON public.business_members
  FOR SELECT
  USING (public.is_business_team_member(auth.uid(), business_id));
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Owner or admin can manage members" ON public.business_members;
  CREATE POLICY "Owner or admin can manage members"
  ON public.business_members
  FOR INSERT
  WITH CHECK (
    public.is_business_owner(auth.uid(), business_id) 
    OR public.has_business_role(auth.uid(), business_id, ARRAY['admin'::public.business_member_role])
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Owner or admin can update members" ON public.business_members;
  CREATE POLICY "Owner or admin can update members"
  ON public.business_members
  FOR UPDATE
  USING (
    public.is_business_owner(auth.uid(), business_id) 
    OR public.has_business_role(auth.uid(), business_id, ARRAY['admin'::public.business_member_role])
  )
  WITH CHECK (
    public.is_business_owner(auth.uid(), business_id) 
    OR public.has_business_role(auth.uid(), business_id, ARRAY['admin'::public.business_member_role])
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Owner or admin can delete members" ON public.business_members;
  CREATE POLICY "Owner or admin can delete members"
  ON public.business_members
  FOR DELETE
  USING (
    public.is_business_owner(auth.uid(), business_id) 
    OR public.has_business_role(auth.uid(), business_id, ARRAY['admin'::public.business_member_role])
  );
END $$;

-- 4) professional_business_links join table and RLS
CREATE TABLE IF NOT EXISTS public.professional_business_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_user_id uuid NOT NULL,
  business_id uuid NOT NULL,
  role_title text,
  status public.link_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_business_links_unique UNIQUE (professional_user_id, business_id),
  CONSTRAINT fk_links_business FOREIGN KEY (business_id) REFERENCES public.business_accounts(id) ON DELETE CASCADE
);

ALTER TABLE public.professional_business_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view approved links" ON public.professional_business_links;
  CREATE POLICY "Public can view approved links"
  ON public.professional_business_links
  FOR SELECT
  USING (status = 'approved');
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Participants can view links" ON public.professional_business_links;
  CREATE POLICY "Participants can view links"
  ON public.professional_business_links
  FOR SELECT
  USING (
    auth.uid() = professional_user_id 
    OR public.is_business_team_member(auth.uid(), business_id)
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Professional or admin can create link" ON public.professional_business_links;
  CREATE POLICY "Professional or admin can create link"
  ON public.professional_business_links
  FOR INSERT
  WITH CHECK (
    auth.uid() = professional_user_id
    OR public.has_business_role(auth.uid(), business_id, ARRAY['admin'::public.business_member_role])
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin or professional can update link" ON public.professional_business_links;
  CREATE POLICY "Admin or professional can update link"
  ON public.professional_business_links
  FOR UPDATE
  USING (
    auth.uid() = professional_user_id
    OR public.has_business_role(auth.uid(), business_id, ARRAY['admin'::public.business_member_role])
  )
  WITH CHECK (
    auth.uid() = professional_user_id
    OR public.has_business_role(auth.uid(), business_id, ARRAY['admin'::public.business_member_role])
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Either party can delete link" ON public.professional_business_links;
  CREATE POLICY "Either party can delete link"
  ON public.professional_business_links
  FOR DELETE
  USING (
    auth.uid() = professional_user_id
    OR public.is_business_team_member(auth.uid(), business_id)
  );
END $$;

-- Validation trigger for link transitions
CREATE OR REPLACE FUNCTION public.link_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.business_id <> OLD.business_id OR NEW.professional_user_id <> OLD.professional_user_id THEN
      RAISE EXCEPTION 'Cannot change link endpoints';
    END IF;

    IF auth.uid() = OLD.professional_user_id THEN
      IF NOT (OLD.status = 'pending' AND NEW.status = 'rejected') THEN
        RAISE EXCEPTION 'Professional can only withdraw pending (set to rejected)';
      END IF;
      IF NEW.role_title IS DISTINCT FROM OLD.role_title THEN
        RAISE EXCEPTION 'Professional cannot change role_title';
      END IF;
    ELSIF public.has_business_role(auth.uid(), OLD.business_id, ARRAY['admin'::public.business_member_role]) THEN
      IF NOT (OLD.status = 'pending' AND NEW.status IN ('approved','rejected')) THEN
        RAISE EXCEPTION 'Admin can only approve/reject pending';
      END IF;
    ELSE
      RAISE EXCEPTION 'Not authorized to update link';
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT (auth.uid() = OLD.professional_user_id OR public.is_business_team_member(auth.uid(), OLD.business_id)) THEN
      RAISE EXCEPTION 'Not authorized to delete link';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_update_guard ON public.professional_business_links;
CREATE TRIGGER trg_link_update_guard
BEFORE UPDATE OR DELETE ON public.professional_business_links
FOR EACH ROW
EXECUTE FUNCTION public.link_update_guard();

-- 5) business_accounts RLS updates per requirements
DO $$ BEGIN
  CREATE POLICY "Public can view business accounts"
  ON public.business_accounts
  FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update business accounts"
  ON public.business_accounts
  FOR UPDATE
  USING (public.has_business_role(auth.uid(), id, ARRAY['admin'::public.business_member_role]))
  WITH CHECK (public.has_business_role(auth.uid(), id, ARRAY['admin'::public.business_member_role]));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6) Light backfill for profiles.role
UPDATE public.profiles SET role = 'visitor' WHERE role IS NULL;