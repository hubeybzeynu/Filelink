CREATE TABLE public.agent_installs (
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('approved', 'installing', 'starting')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, device_name)
);

GRANT ALL ON public.agent_installs TO service_role;
ALTER TABLE public.agent_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages agent installs"
  ON public.agent_installs FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
