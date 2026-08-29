create or replace function public.tnb_state_json(_uid uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare _p public.players; _per_click bigint := 1; _per_sec bigint := 0; _ups jsonb := '{}'::jsonb; _alias text; u record;
begin
  select * into _p from public.players where user_id = _uid;
  if not found then return null; end if;
  select alias into _alias from public.profiles where id = _uid;
  for u in select * from public.upgrades order by sort_order loop
    _per_click := _per_click + u.per_click * coalesce((_p.owned ->> u.id)::int, 0);
    _per_sec := _per_sec + u.per_sec * coalesce((_p.owned ->> u.id)::int, 0);
    _ups := _ups || jsonb_build_object(u.id, jsonb_build_object(
      'name', u.name, 'perClick', u.per_click, 'perSec', u.per_sec,
      'nextCost', floor(u.base_cost * power(u.growth, coalesce((_p.owned ->> u.id)::int, 0)))::bigint));
  end loop;
  return jsonb_build_object(
    'score', _p.score, 'perClick', _per_click, 'perSec', _per_sec,
    'upgrades', _ups, 'owned', _p.owned, 'name', coalesce(_alias, 'anonymous'),
    'bestCombo', _p.best_combo, 'perfectTaps', _p.perfect_taps, 'criticalTaps', _p.critical_taps);
end $$;

create or replace function public.tnb_state()
returns jsonb language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _p public.players; _per_sec bigint := 0; _gain bigint := 0; u record;
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  insert into public.profiles (id) values (_uid) on conflict (id) do nothing;
  insert into public.players (user_id) values (_uid) on conflict (user_id) do nothing;
  select * into _p from public.players where user_id = _uid;
  for u in select * from public.upgrades loop
    _per_sec := _per_sec + u.per_sec * coalesce((_p.owned ->> u.id)::int, 0);
  end loop;
  _gain := floor(extract(epoch from (now() - _p.updated_at)) * _per_sec)::bigint;
  if _gain > 0 then
    update public.players set score = score + _gain, updated_at = now() where user_id = _uid;
  end if;
  return public.tnb_state_json(_uid);
end $$;

create or replace function public.tnb_click(_taps integer default 1)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _per_click bigint := 1; _p public.players; u record;
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  perform public.tnb_state();
  select * into _p from public.players where user_id = _uid;
  for u in select * from public.upgrades loop
    _per_click := _per_click + u.per_click * coalesce((_p.owned ->> u.id)::int, 0);
  end loop;
  update public.players
    set score = score + _per_click * least(greatest(coalesce(_taps, 1), 1), 10), updated_at = now()
    where user_id = _uid;
  return public.tnb_state_json(_uid);
end $$;

create or replace function public.tnb_buy(_upgrade_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _p public.players; _u public.upgrades; _owned int; _cost bigint;
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  perform public.tnb_state();
  select * into _u from public.upgrades where id = _upgrade_id;
  if not found then raise exception 'unknown upgrade'; end if;
  select * into _p from public.players where user_id = _uid;
  _owned := coalesce((_p.owned ->> _u.id)::int, 0);
  _cost := floor(_u.base_cost * power(_u.growth, _owned))::bigint;
  if _p.score < _cost then raise exception 'not enough $TNB'; end if;
  update public.players
    set score = score - _cost,
        owned = _p.owned || jsonb_build_object(_u.id, _owned + 1),
        updated_at = now()
    where user_id = _uid;
  return public.tnb_state_json(_uid);
end $$;

create or replace function public.tnb_reset()
returns jsonb language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  perform public.tnb_state();
  update public.players
    set score = 0, owned = '{}'::jsonb, best_combo = 0, perfect_taps = 0, critical_taps = 0, updated_at = now()
    where user_id = _uid;
  return public.tnb_state_json(_uid);
end $$;

create or replace function public.tnb_set_alias(_alias text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _clean text;
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  _clean := nullif(btrim(regexp_replace(coalesce(_alias, ''), '[^a-zA-Z0-9 _\.\-]', '', 'g')), '');
  if _clean is null then _clean := 'anonymous'; end if;
  _clean := left(_clean, 16);
  perform public.tnb_state();
  update public.profiles set alias = _clean where id = _uid;
  return public.tnb_state_json(_uid);
end $$;

create or replace function public.tnb_stats(_combo integer, _perfect integer, _critical integer)
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null then return; end if;
  update public.players
    set best_combo = greatest(best_combo, coalesce(_combo, 0)),
        perfect_taps = greatest(perfect_taps, coalesce(_perfect, 0)),
        critical_taps = greatest(critical_taps, coalesce(_critical, 0))
    where user_id = _uid;
end $$;

create or replace function public.tnb_leaderboard(_limit integer default 10)
returns table (id uuid, name text, score bigint)
language sql stable security definer set search_path = public as $$
  select p.user_id, coalesce(pr.alias, 'anonymous'), p.score
  from public.players p
  left join public.profiles pr on pr.id = p.user_id
  order by p.score desc, p.created_at asc
  limit least(greatest(coalesce(_limit, 10), 1), 100);
$$;

grant execute on function public.tnb_state(), public.tnb_click(integer), public.tnb_buy(text),
  public.tnb_reset(), public.tnb_set_alias(text), public.tnb_stats(integer,integer,integer) to authenticated;
grant execute on function public.tnb_leaderboard(integer) to anon, authenticated;
revoke execute on function public.tnb_state_json(uuid) from anon, authenticated;