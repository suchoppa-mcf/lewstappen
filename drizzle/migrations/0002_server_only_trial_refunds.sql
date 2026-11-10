CREATE FUNCTION public.refund_basic_trial_for_user(account_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ UPDATE public.user_plans SET trials_used = greatest(0, trials_used - 1), updated_at = now() WHERE user_id = account_id; $$;
REVOKE ALL ON FUNCTION public.refund_basic_trial_for_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_basic_trial_for_user(uuid) TO service_role;
COMMENT ON FUNCTION public.refund_basic_trial() IS 'DEPRECATED: use server-only refund_basic_trial_for_user after caller verification.';