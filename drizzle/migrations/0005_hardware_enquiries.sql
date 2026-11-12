CREATE TABLE public.hardware_enquiries (
 id uuid PRIMARY KEY,
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
 email text NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
 area text NOT NULL CHECK (length(area) BETWEEN 1 AND 150),
 device text NOT NULL CHECK (device IN ('Desktop / PC','Laptop','Server / NAS','Other device')),
 model text NOT NULL DEFAULT '' CHECK (length(model) <= 200),
 goals text NOT NULL CHECK (length(goals) BETWEEN 1 AND 2000),
 details text NOT NULL DEFAULT '' CHECK (length(details) <= 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hardware_enquiries TO authenticated;
GRANT ALL ON public.hardware_enquiries TO service_role;
ALTER TABLE public.hardware_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY developer_hardware_read ON public.hardware_enquiries FOR SELECT TO authenticated USING (public.is_developer());
CREATE INDEX hardware_enquiries_created_idx ON public.hardware_enquiries (created_at DESC);