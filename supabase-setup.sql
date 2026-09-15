-- Campus Draw v2: a new 45-location round, authorized on 2026-09-15.
-- Run as project owner. Legacy letter records are retained, never reset/deleted.
-- Re-running preserves all v2 assignments. Publish the matching v2 frontend.
begin;
create table if not exists public.lab1_locations_v2 (
  id text primary key check (id ~ '^(0[1-9]|[1-3][0-9]|4[0-5])$')
);
insert into public.lab1_locations_v2(id)
select lpad(n::text, 2, '0') from generate_series(1,45) as n
on conflict do nothing;
create table if not exists public.lab1_location_assignments_v2 (
  student_id text primary key check (student_id ~ '^[0-9]{8}$'),
  location_id text not null unique references public.lab1_locations_v2(id),
  assigned_at timestamptz not null default now()
);
alter table public.lab1_locations_v2 enable row level security;
alter table public.lab1_location_assignments_v2 enable row level security;
revoke all on table public.lab1_locations_v2, public.lab1_location_assignments_v2 from public, anon, authenticated;

create or replace function public.lab1_location_state_v2(p_student_id text)
returns jsonb language sql stable security invoker set search_path = '' set timezone = 'UTC'
as $$
  select jsonb_build_object(
    'studentId', p_student_id, 'locationId', a.location_id,
    'drawsUsed', case when a.student_id is null then 0 else 1 end,
    'revision', case when a.student_id is null then 0 else 1 end,
    'locked', a.student_id is not null, 'assignedAt', a.assigned_at,
    'remainingLocations', (select count(*) from public.lab1_locations_v2 l where not exists
      (select 1 from public.lab1_location_assignments_v2 used where used.location_id = l.id)),
    'totalLocations', 45
  ) from (select 1) as singleton left join public.lab1_location_assignments_v2 a on a.student_id = p_student_id;
$$;
revoke all on function public.lab1_location_state_v2(text) from public, anon, authenticated;

create or replace function public.lab1_location_draw_v2(p_action text, p_student_id text, p_expected_revision integer default null)
returns jsonb language plpgsql volatile security definer
set search_path = '' set timezone = 'UTC' set lock_timeout = '10s'
as $$
declare v_state jsonb; v_location text;
begin
  if p_student_id is null or p_student_id !~ '^[0-9]{8}$' then
    return jsonb_build_object('error', 'INVALID_STUDENT_ID');
  end if;
  if p_action is null or p_action not in ('lookup', 'draw') then
    return jsonb_build_object('error', 'INVALID_ACTION');
  end if;
  if p_action = 'draw' and (p_expected_revision is null or p_expected_revision < 0) then
    return jsonb_build_object('error', 'INVALID_REVISION');
  end if;
  if p_action = 'draw' then
    -- One shared transaction lock protects the remaining pool across ALL students.
    -- The unique location_id constraint provides an independent final safeguard.
    perform pg_catalog.pg_advisory_xact_lock(60105, 2);
  end if;
  v_state := public.lab1_location_state_v2(p_student_id);
  if p_action = 'lookup' or (v_state->>'locked')::boolean then
    return jsonb_build_object('state', v_state);
  end if;
  if p_expected_revision <> 0 then
    return jsonb_build_object('error', 'STATE_CHANGED', 'state', v_state);
  end if;
  select l.id into v_location from public.lab1_locations_v2 l
  where not exists (select 1 from public.lab1_location_assignments_v2 a where a.location_id = l.id)
  order by pg_catalog.random() limit 1;
  if v_location is null then
    return jsonb_build_object('error', 'POOL_EXHAUSTED', 'state', v_state);
  end if;
  insert into public.lab1_location_assignments_v2(student_id, location_id)
  values (p_student_id, v_location);
  return jsonb_build_object('state', public.lab1_location_state_v2(p_student_id));
end;
$$;
revoke all on function public.lab1_location_draw_v2(text, text, integer) from public, anon, authenticated;
grant execute on function public.lab1_location_draw_v2(text, text, integer) to anon, authenticated;
-- Archive the old round by removing visitor writes via its RPC. Its table stays intact.
do $$ begin
  if to_regprocedure('public.lab1_campus_draw(text,text,integer)') is not null then
    revoke all on function public.lab1_campus_draw(text,text,integer) from public, anon, authenticated;
  end if;
end $$;
notify pgrst, 'reload schema';
commit;
