CREATE TABLE public.power_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('shutdown', 'restart')),
  fire_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz
);

CREATE INDEX power_schedules_room_status_idx ON public.power_schedules(room_id, status, fire_at);
CREATE INDEX power_schedules_device_idx ON public.power_schedules(device_id, status);

GRANT ALL ON public.power_schedules TO service_role;
ALTER TABLE public.power_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages power schedules"
  ON public.power_schedules FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
