ALTER TABLE public.user_plans ADD COLUMN has_special_access boolean NOT NULL DEFAULT false;
CREATE TYPE public.app_role AS ENUM ('developer');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_role ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.is_developer() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='developer'); $$;
REVOKE ALL ON FUNCTION public.is_developer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_developer() TO authenticated;
CREATE TABLE public.special_access_whitelist (email text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.special_access_whitelist TO authenticated;
GRANT ALL ON public.special_access_whitelist TO service_role;
ALTER TABLE public.special_access_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY developer_whitelist ON public.special_access_whitelist FOR ALL TO authenticated USING(public.is_developer()) WITH CHECK(public.is_developer());
CREATE TABLE public.promo_codes (code text PRIMARY KEY, is_active boolean NOT NULL DEFAULT true, expires_at timestamptz, max_uses integer CHECK(max_uses>0), uses integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), CHECK(code=upper(btrim(code))));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY developer_promos ON public.promo_codes FOR ALL TO authenticated USING(public.is_developer()) WITH CHECK(public.is_developer());
CREATE TABLE public.promo_redemptions (user_id uuid NOT NULL, code text NOT NULL REFERENCES public.promo_codes(code), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,code));
GRANT SELECT ON public.promo_redemptions TO authenticated;
GRANT ALL ON public.promo_redemptions TO service_role;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_redemptions ON public.promo_redemptions FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_developer());
CREATE TABLE public.usage_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, source text NOT NULL, target text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.usage_events TO authenticated;
GRANT ALL ON public.usage_events TO service_role;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY usage_read ON public.usage_events FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_developer());
CREATE INDEX usage_user_date ON public.usage_events(user_id,created_at);
INSERT INTO public.usage_events(id,user_id,source,target,created_at) SELECT id,user_id,source,target,created_at FROM public.modernizations ON CONFLICT DO NOTHING;
CREATE FUNCTION public.has_special_eligibility() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT auth.uid() IS NOT NULL AND (
 EXISTS(SELECT 1 FROM public.pricing_settings WHERE id='specials' AND is_active AND all_plans_free)
 OR EXISTS(SELECT 1 FROM public.user_plans WHERE user_id=auth.uid() AND has_special_access)
 OR EXISTS(SELECT 1 FROM public.special_access_whitelist WHERE lower(email)=lower(auth.jwt()->>'email'))
 OR EXISTS(SELECT 1 FROM public.promo_redemptions r JOIN public.promo_codes p USING(code) WHERE r.user_id=auth.uid() AND p.is_active AND (p.expires_at IS NULL OR p.expires_at>now()))); $$;
REVOKE ALL ON FUNCTION public.has_special_eligibility() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_special_eligibility() TO authenticated;
CREATE FUNCTION public.redeem_promo(entered_code text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE promo public.promo_codes; normalized text:=upper(btrim(entered_code));
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to redeem a promotion.'; END IF;
 SELECT * INTO promo FROM public.promo_codes WHERE code=normalized FOR UPDATE;
 IF NOT FOUND OR NOT promo.is_active OR (promo.expires_at IS NOT NULL AND promo.expires_at<=now()) THEN RAISE EXCEPTION 'This promotion is invalid or expired.'; END IF;
 IF EXISTS(SELECT 1 FROM public.promo_redemptions WHERE user_id=auth.uid() AND code=normalized) THEN RETURN true; END IF;
 IF promo.max_uses IS NOT NULL AND promo.uses>=promo.max_uses THEN RAISE EXCEPTION 'This promotion has reached its usage limit.'; END IF;
 INSERT INTO public.promo_redemptions(user_id,code) VALUES(auth.uid(),normalized);
 UPDATE public.promo_codes SET uses=uses+1 WHERE code=normalized;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.redeem_promo(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_promo(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.activate_free_plan(selected_tier text) RETURNS public.user_plans LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.user_plans;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to activate a plan.'; END IF;
 IF selected_tier NOT IN ('basic','pro','premium') THEN RAISE EXCEPTION 'Invalid plan.'; END IF;
 IF selected_tier<>'basic' AND NOT public.has_special_eligibility() THEN RAISE EXCEPTION 'Your account does not have special access. No payment was taken.'; END IF;
 INSERT INTO public.user_plans(user_id,tier) VALUES(auth.uid(),selected_tier) ON CONFLICT(user_id) DO UPDATE SET tier=selected_tier,updated_at=now() RETURNING * INTO result;
 RETURN result;
END; $$;
GRANT UPDATE ON public.pricing_settings TO authenticated;
CREATE POLICY developer_settings ON public.pricing_settings FOR UPDATE TO authenticated USING(public.is_developer()) WITH CHECK(public.is_developer());
CREATE FUNCTION public.developer_update_account(account_id uuid, selected_tier text, special_access boolean, reset_trials boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.is_developer() THEN RAISE EXCEPTION 'Developer access required.'; END IF;
 IF selected_tier NOT IN ('basic','pro','premium') THEN RAISE EXCEPTION 'Invalid plan.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=account_id) THEN RAISE EXCEPTION 'Account not found.'; END IF;
 INSERT INTO public.user_plans(user_id,tier,has_special_access) VALUES(account_id,selected_tier,special_access)
 ON CONFLICT(user_id) DO UPDATE SET tier=selected_tier,has_special_access=special_access,trials_used=CASE WHEN reset_trials THEN 0 ELSE public.user_plans.trials_used END,updated_at=now();
END; $$;
REVOKE ALL ON FUNCTION public.developer_update_account(uuid,text,boolean,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.developer_update_account(uuid,text,boolean,boolean) TO authenticated;
CREATE FUNCTION public.developer_overview() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.is_developer() THEN RAISE EXCEPTION 'Developer access required.'; END IF;
 SELECT jsonb_build_object('totalUsers',(SELECT count(*) FROM auth.users),'totalUses',(SELECT count(*) FROM public.usage_events),'users',coalesce((SELECT jsonb_agg(row_to_json(directory) ORDER BY directory.created_at DESC) FROM (
 SELECT u.id,u.email,u.created_at,u.email_confirmed_at,coalesce(p.tier,'basic') AS tier,coalesce(p.trials_used,0) AS trials_used,coalesce(p.has_special_access,false) AS has_special_access,coalesce(v.uses,0) AS uses,v.last_use
 FROM auth.users u LEFT JOIN public.user_plans p ON p.user_id=u.id LEFT JOIN (SELECT user_id,count(*) AS uses,max(created_at) AS last_use FROM public.usage_events GROUP BY user_id) v ON v.user_id=u.id
 ) directory),'[]'::jsonb)) INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.developer_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.developer_overview() TO authenticated;