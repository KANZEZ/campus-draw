import { requestAssignment } from './transport.js';
import { LOCATIONS } from './locations.js';
import { setMapLocation } from './map.js';
const $ = id => document.getElementById(id);
let state = null, busy = false;
const messages = {
  INVALID_STUDENT_ID: 'Enter an 8-digit student ID.',
  POOL_EXHAUSTED: 'All 45 locations assigned.',
  NOT_CONFIGURED: 'Draw not open yet.',
  SERVER_ERROR: 'Request failed. Try again.',
};
function notice(message = '', error = false) {
  $('notice').textContent = message;
  $('notice').classList.toggle('error', error);
  $('notice').classList.toggle('sr-only', !error);
}
function render() {
  const location = LOCATIONS.find(l => l.id === state?.locationId);
  $('location-name').textContent = location?.name ?? '—';
  $('official-map').href = location?.mapUrl ?? 'https://www.polyu.edu.hk/campus-map/';
  $('receipt').disabled = busy || !location;
  $('submit').disabled = busy || (state?.remainingLocations === 0 && !location);
  $('submit').textContent = busy ? 'Assigning…' : 'Assign';
  $('student-id').disabled = busy;
  $('student-form').setAttribute('aria-busy', String(busy));
  $('map-description').textContent = location ? `Assigned region: ${location.name}` : 'Assigned region';
  setMapLocation(location);
}
async function api(action, studentId, revision) {
  const response = await requestAssignment(action, studentId, revision);
  const data = await response.json();
  if (!response.ok || data.error) {
    const error = new Error(data.error ?? data.code ?? 'SERVER_ERROR');
    error.code = data.code === 'PGRST202' || response.status === 404 ? 'NOT_CONFIGURED' : data.error ?? data.code ?? 'SERVER_ERROR';
    error.state = data.state;
    throw error;
  }
  if (!data.state || data.state.studentId !== studentId || data.state.totalLocations !== 45 ||
      (data.state.locationId !== null && !LOCATIONS.some(l => l.id === data.state.locationId))) {
    const error = new Error('Invalid assignment response'); error.code = 'SERVER_ERROR'; throw error;
  }
  return data.state;
}
async function loadStudent(studentId, drawIfNew) {
  if (busy) return;
  busy = true; notice(); render();
  try {
    let next = await api('lookup', studentId);
    if (!next.locked && drawIfNew && next.remainingLocations > 0) next = await api('draw', studentId, 0);
    state = next;
    notice(!next.locked && next.remainingLocations === 0 ? messages.POOL_EXHAUSTED : '', !next.locked && next.remainingLocations === 0);
    try { sessionStorage.setItem('campus-student-v2', studentId); } catch {}
  } catch (error) {
    if (error.state) state = error.state;
    if (error.code) notice(messages[error.code] ?? messages.SERVER_ERROR, true);
    else {
      // A lost response may follow a committed draw. Recover with a read only.
      try { state = await api('lookup', studentId); notice(state.locked ? '' : 'Connection failed. Try again.', !state.locked); }
      catch { notice('Connection failed. Try again.', true); }
    }
  } finally { busy = false; render(); }
}
$('student-form').addEventListener('submit', event => {
  event.preventDefault(); if (busy) return;
  const studentId = $('student-id').value.trim();
  if (!/^\d{8}$/.test(studentId)) {
    $('student-id').setAttribute('aria-invalid', 'true'); notice(messages.INVALID_STUDENT_ID, true); $('student-id').focus(); return;
  }
  $('student-id').removeAttribute('aria-invalid'); loadStudent(studentId, true);
});
$('student-id').addEventListener('input', () => {
  $('student-id').removeAttribute('aria-invalid');
  if (state && $('student-id').value.trim() !== state.studentId) { state = null; notice(); render(); }
});
$('receipt').addEventListener('click', () => {
  const location = LOCATIONS.find(l => l.id === state?.locationId); if (!location) return;
  const content = ['Campus Draw — Lab 1 / Question 5', `Student ID: ${state.studentId}`,
    `Location: ${location.id} — ${location.name}`, `Shooting point: ${location.shootingPoint}`,
    `Map: ${location.mapUrl}`, `Assigned at (UTC): ${state.assignedAt}`, 'Final assignment. One draw.', ''].join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `Q5_${state.studentId}_receipt.txt`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
render();
let previous = null; try { previous = sessionStorage.getItem('campus-student-v2'); } catch {}
if (previous && /^\d{8}$/.test(previous)) { $('student-id').value = previous; loadStudent(previous, false); }
