CREATE TABLE public.modernizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  source text NOT NULL, target text NOT NULL, input text NOT NULL, raw text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modernizations TO authenticated;
GRANT ALL ON public.modernizations TO service_role;
ALTER TABLE public.modernizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rows" ON public.modernizations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL, source text NOT NULL, target text NOT NULL, goals jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presets TO authenticated;
GRANT ALL ON public.presets TO service_role;
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rows" ON public.presets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);