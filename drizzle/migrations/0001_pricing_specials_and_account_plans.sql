CREATE TABLE public.pricing_settings (
 id text PRIMARY KEY DEFAULT 'specials' CHECK (id = 'specials'),
 all_plans_free boolean NOT NULL DEFAULT true,
 special_tag text NOT NULL DEFAULT 'Free launch special',
 promo_description text NOT NULL DEFAULT 'All plans activate free. No card required.',
 is_active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.pricing_settings TO anon, authenticated;
GRANT ALL ON public.pricing_settings TO service_role;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public pricing settings" ON public.pricing_settings FOR SELECT TO anon, authenticated USING (true);
CREATE TABLE public.user_plans (
 user_id uuid PRIMARY KEY DEFAULT auth.uid(),
 tier text NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic','pro','premium')),
 trials_used integer NOT NULL DEFAULT 0 CHECK (trials_used BETWEEN 0 AND 3),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_plans TO authenticated;
GRANT ALL ON public.user_plans TO service_role;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own plan" ON public.user_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE FUNCTION public.activate_free_plan(selected_tier text) RETURNS public.user_plans LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.user_plans;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to activate a plan.'; END IF;
 IF selected_tier NOT IN ('basic','pro','premium') THEN RAISE EXCEPTION 'Invalid plan.'; END IF;
 IF selected_tier <> 'basic' AND NOT EXISTS (SELECT 1 FROM public.pricing_settings WHERE id = 'specials' AND is_active AND all_plans_free) THEN RAISE EXCEPTION 'The free special is not active. No payment was taken.'; END IF;
 INSERT INTO public.user_plans(user_id,tier) VALUES(auth.uid(),selected_tier)
 ON CONFLICT(user_id) DO UPDATE SET tier = selected_tier, updated_at = now() RETURNING * INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.activate_free_plan(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_free_plan(text) TO authenticated;
CREATE FUNCTION public.reserve_basic_trial(code_text text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_plan public.user_plans; line_count integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to update code.'; END IF;
 INSERT INTO public.user_plans(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 SELECT * INTO current_plan FROM public.user_plans WHERE user_id = auth.uid() FOR UPDATE;
 IF current_plan.tier <> 'basic' THEN RETURN false; END IF;
 SELECT count(*) INTO line_count FROM regexp_split_to_table(code_text, E'\n') AS line WHERE btrim(line, E' \t\r') <> '';
 IF line_count > 5 THEN RAISE EXCEPTION 'Basic allows up to 5 non-blank lines per update. Choose Pro or Premium for more.'; END IF;
 IF current_plan.trials_used >= 3 THEN RAISE EXCEPTION 'All 3 Basic trials have been used. Choose Pro or Premium to continue.'; END IF;
 UPDATE public.user_plans SET trials_used = trials_used + 1, updated_at = now() WHERE user_id = auth.uid();
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_basic_trial(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_basic_trial(text) TO authenticated;
CREATE FUNCTION public.refund_basic_trial() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
 UPDATE public.user_plans SET trials_used = greatest(0, trials_used - 1), updated_at = now() WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.refund_basic_trial() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_basic_trial() TO service_role;