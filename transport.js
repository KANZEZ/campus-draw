import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

export async function requestAssignment(action, studentId, expectedRevision) {
  const url = SUPABASE_URL.trim().replace(/\/$/, '');
  const key = SUPABASE_PUBLISHABLE_KEY.trim();
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    const error = new Error('NOT_CONFIGURED');
    error.code = 'NOT_CONFIGURED';
    throw error;
  }
  return fetch(`${url}/rest/v1/rpc/lab1_campus_draw`, {
    method: 'POST',
    // Publishable keys go in apikey, not Authorization: Bearer (they are not JWTs).
    headers: { 'Content-Type': 'application/json', apikey: key },
    body: JSON.stringify({ p_action: action, p_student_id: studentId,
      p_expected_revision: expectedRevision ?? null }),
    signal: AbortSignal.timeout(12_000),
  });
}
