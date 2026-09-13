-- Run this entire file in a NEW Supabase project's SQL Editor as its owner.
-- No student records or credentials are embedded in this script.
-- Re-running it preserves existing assignments; it does not reset any chances.
begin;

create table if not exists public.lab1_assignments (
  student_id text primary key check (student_id ~ '^[0-9]{8}$'),
  letter text not null check (letter ~ '^[A-Z]$'),
  draws_used integer not null check (draws_used between 1 and 3),
  revision integer not null check (revision >= draws_used),
  locked boolean not null,
  lock_reason text check (lock_reason in ('confirmed', 'exhausted')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  locked_at timestamptz,
  history jsonb not null check (jsonb_typeof(history) = 'array' and jsonb_array_length(history) = draws_used),
  check (draws_used < 3 or locked),
  check ((not locked and lock_reason is null and locked_at is null)
    or (locked and lock_reason is not null and locked_at is not null))
);

alter table public.lab1_assignments enable row level security;
revoke all on table public.lab1_assignments from public, anon, authenticated;
-- No direct table access or RLS policies for visitors. All visitor operations
-- pass through one restricted function below, including per-ID lookups.

create or replace function public.lab1_assignment_state(p_student_id text)
returns jsonb
language sql
security invoker
set search_path = ''
set timezone = 'UTC'
as $$
  select coalesce(
    (select jsonb_build_object(
      'studentId', student_id, 'letter', letter, 'drawsUsed', draws_used,
      'revision', revision, 'remainingDraws', 3 - draws_used,
      'locked', locked, 'lockReason', lock_reason, 'lockedAt', locked_at,
      'updatedAt', updated_at, 'history', history
    ) from public.lab1_assignments where student_id = p_student_id),
    jsonb_build_object(
      'studentId', p_student_id, 'letter', null, 'drawsUsed', 0,
      'revision', 0, 'remainingDraws', 3, 'locked', false,
      'lockReason', null, 'lockedAt', null, 'updatedAt', null, 'history', '[]'::jsonb
    )
  );
$$;
revoke all on function public.lab1_assignment_state(text) from public, anon, authenticated;

create or replace function public.lab1_campus_draw(
  p_action text,
  p_student_id text,
  p_expected_revision integer default null
)
returns jsonb
language plpgsql
volatile
-- Required: visitors cannot update the table or call the internal helper.
-- The function owner can, after checking every operation and state revision.
security definer
set search_path = ''
set timezone = 'UTC'
set lock_timeout = '5s'
as $$
declare
  v_state jsonb;
  v_letter text;
  v_attempt integer;
  v_locked boolean;
  v_now timestamptz;
  v_history jsonb;
begin
  if p_student_id is null or p_student_id !~ '^[0-9]{8}$' then
    return jsonb_build_object('error', 'INVALID_STUDENT_ID');
  end if;
  if p_action is null or p_action not in ('lookup', 'draw', 'confirm') then
    return jsonb_build_object('error', 'INVALID_ACTION');
  end if;
  if p_action <> 'lookup' and (p_expected_revision is null or p_expected_revision < 0) then
    return jsonb_build_object('error', 'INVALID_REVISION');
  end if;

  -- Transaction-scoped per-ID lock covers first insertion as well as updates.
  -- Requests for different student IDs can proceed independently.
  perform pg_catalog.pg_advisory_xact_lock(60106, p_student_id::integer);
  v_state := public.lab1_assignment_state(p_student_id);
  if p_action = 'lookup' then
    return jsonb_build_object('state', v_state);
  end if;
  if (v_state->>'locked')::boolean then
    return jsonb_build_object('error', 'ALREADY_LOCKED', 'state', v_state);
  end if;
  if (v_state->>'revision')::integer <> p_expected_revision then
    return jsonb_build_object('error', 'STATE_CHANGED', 'state', v_state);
  end if;

  v_now := pg_catalog.clock_timestamp();
  if p_action = 'confirm' then
    if (v_state->>'drawsUsed')::integer = 0 then
      return jsonb_build_object('error', 'DRAW_FIRST', 'state', v_state);
    end if;
    update public.lab1_assignments set
      locked = true, lock_reason = 'confirmed', revision = revision + 1,
      updated_at = v_now, locked_at = v_now
    where student_id = p_student_id;
  else
    -- The server chooses among letters not previously drawn by this student.
    select chr(code) into v_letter
    from generate_series(65, 90) as alphabet(code)
    where not exists (
      select 1 from jsonb_array_elements(v_state->'history') as previous(draw)
      where previous.draw->>'letter' = chr(code)
    )
    order by random()
    limit 1;
    v_attempt := (v_state->>'drawsUsed')::integer + 1;
    v_locked := v_attempt = 3;
    v_history := (v_state->'history') || jsonb_build_array(
      jsonb_build_object('attempt', v_attempt, 'letter', v_letter, 'drawnAt', v_now)
    );
    insert into public.lab1_assignments as a
      (student_id, letter, draws_used, revision, locked, lock_reason,
       created_at, updated_at, locked_at, history)
    values
      (p_student_id, v_letter, v_attempt, p_expected_revision + 1, v_locked,
       case when v_locked then 'exhausted' end, v_now, v_now,
       case when v_locked then v_now end, v_history)
    on conflict (student_id) do update set
      letter = excluded.letter, draws_used = excluded.draws_used,
      revision = excluded.revision, locked = excluded.locked,
      lock_reason = excluded.lock_reason, updated_at = excluded.updated_at,
      locked_at = excluded.locked_at, history = excluded.history;
  end if;
  return jsonb_build_object('state', public.lab1_assignment_state(p_student_id));
end;
$$;

revoke all on function public.lab1_campus_draw(text, text, integer) from public, anon, authenticated;
grant execute on function public.lab1_campus_draw(text, text, integer) to anon, authenticated;
-- Let PostgREST discover the function after this transaction commits.
notify pgrst, 'reload schema';
commit;
