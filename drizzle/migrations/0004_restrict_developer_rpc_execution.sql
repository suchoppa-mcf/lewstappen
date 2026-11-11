REVOKE EXECUTE ON FUNCTION public.is_developer() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_special_eligibility() FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_promo(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.developer_overview() FROM anon;
REVOKE EXECUTE ON FUNCTION public.developer_update_account(uuid,text,boolean,boolean) FROM anon;