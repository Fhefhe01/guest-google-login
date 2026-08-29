revoke all on function public.tnb_state_json(uuid) from public;
revoke all on function public.tnb_state_json(uuid) from anon, authenticated;
revoke all on function public.tnb_state() from anon;
revoke all on function public.tnb_click(integer) from anon;
revoke all on function public.tnb_buy(text) from anon;
revoke all on function public.tnb_reset() from anon;
revoke all on function public.tnb_set_alias(text) from anon;
revoke all on function public.tnb_stats(integer,integer,integer) from anon;