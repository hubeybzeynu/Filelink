CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  token text NOT NULL,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'extended')),
  tier_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX app_users_username_idx ON public.app_users (lower(username));

GRANT ALL ON public.app_users TO service_role;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages app users"
  ON public.app_users FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Links a room to the account that created it, so admin-shell access can be
-- gated by that account's subscription tier. Nullable — rooms created
-- before accounts existed have no owner and are treated as unrestricted.
ALTER TABLE public.rooms ADD COLUMN owner_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL;
CREATE INDEX rooms_owner_idx ON public.rooms (owner_user_id);
