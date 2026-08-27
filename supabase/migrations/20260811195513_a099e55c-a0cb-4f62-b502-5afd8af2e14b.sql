CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Untitled room',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  token text NOT NULL,
  platform text,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX devices_room_idx ON public.devices(room_id);
GRANT ALL ON public.devices TO service_role;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  path text NOT NULL,
  parent_path text NOT NULL DEFAULT '/',
  name text NOT NULL,
  created_by uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, path)
);
CREATE INDEX folders_room_parent_idx ON public.folders(room_id, parent_path);
GRANT ALL ON public.folders TO service_role;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  folder_path text NOT NULL DEFAULT '/',
  file_name text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  from_device uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  from_name text NOT NULL DEFAULT 'unknown',
  to_device uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  to_name text,
  status text NOT NULL DEFAULT 'uploading',
  direct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  ready_at timestamptz,
  delivered_at timestamptz
);
CREATE INDEX transfers_room_idx ON public.transfers(room_id, folder_path);
CREATE INDEX transfers_to_idx ON public.transfers(to_device, status);
GRANT ALL ON public.transfers TO service_role;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS local_url text,
  ADD COLUMN IF NOT EXISTS shared_root text;

CREATE TABLE public.device_rpc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  from_device uuid NOT NULL,
  target_device uuid NOT NULL,
  method text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);

GRANT ALL ON public.device_rpc TO service_role;

ALTER TABLE public.device_rpc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages device rpc"
  ON public.device_rpc FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_device_rpc_target ON public.device_rpc (target_device, status, created_at);
CREATE INDEX idx_device_rpc_status ON public.device_rpc (status, created_at);

ALTER TABLE public.device_rpc
  ADD COLUMN IF NOT EXISTS chunks jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS agent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS os_info text;

GRANT ALL ON public.devices TO service_role;