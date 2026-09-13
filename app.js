import { requestAssignment } from './transport.js';

const $ = id => document.getElementById(id);
const copy = {
  en: {
    eyebrow: 'YOUR NEXT FIELD ASSIGNMENT', title1: 'A new view', title2: 'of campus.',
    lead: 'One letter. A place to explore. A panorama to make.',
    intro: 'Draw your location for the OpenCV stitching task. You get three draws in total. Choose carefully — your final letter is yours to keep.',
    studentLabel: 'YOUR STUDENT ID', inputHint: 'Enter your own 8-digit ID. Returning? Your saved draw will appear.',
    submit: 'Get my assignment', ticketLabel: 'CAMPUS FIELDWORK PASS', ready: 'READY WHEN YOU ARE',
    emptyTitle: 'Your location awaits', emptyCopy: 'Enter your student ID to reveal your first letter.',
    confirm: 'Confirm & lock', decisionNote: 'A redraw replaces your current letter. You cannot go back.',
    lockedNote: 'Saved. Your assignment is final.', receipt: 'Download assignment receipt ↓',
    caption: 'A small draw. A different perspective.', rulesTitle: 'BEFORE YOU HEAD OUT',
    rule1Title: 'Three draws, total.', rule1Copy: 'Your first draw plus two optional redraws. Each redraw gives you a different letter.',
    rule2Title: 'Keep it? Lock it.', rule2Copy: 'Confirm any draw to make it final. Your third draw locks automatically. Refreshing never resets your chances.',
    rule3Title: 'Go. Capture. Stitch.', rule3Copy: 'Use the course location list to find your letter. Take three overlapping photos and one location evidence photo for Q6.',
    footer: 'Made for looking a little closer.', busy: 'Saving your assignment…', checking: 'Checking your saved assignment…',
    firstStatus: 'DRAW {used} OF 3 · YOUR CHOICE', finalStatus: 'FINAL ASSIGNMENT · LOCKED',
    location: 'Location {letter}', finalLocation: 'Your final location: {letter}',
    remaining: '{remaining} redraws left. Keep this letter or try another.',
    lastChance: '1 redraw left. Your next draw will lock automatically.',
    confirmedCopy: 'You confirmed this letter. It can no longer be changed.',
    exhaustedCopy: 'Your third draw is final. It can no longer be changed.',
    redraw: 'Draw another', lastRedraw: 'Last redraw · locks result',
    restored: 'Your saved assignment is shown. No draw was used.',
    drawn: 'Draw {used} saved. You can confirm this letter or draw again.',
    locked: 'Location {letter} is locked. Keep your receipt for Q6.',
    newId: 'No draw yet for this ID. Select “Get my assignment” to begin.',
    invalid: 'Please enter your own 8-digit student ID.',
    changed: 'This ID was updated in another tab or session. The latest saved result is shown.',
    alreadyLocked: 'This ID is already locked. Its final assignment is shown.',
    network: 'Could not reach the server. Please check your connection and try again.',
    recovered: 'Connection interrupted, but your saved record was retrieved. Check the result before continuing.',
    server: 'The request could not be completed. Please try again.',
    drawFirst: 'Draw a letter before confirming.',
    notConfigured: 'Assignment service is not configured yet. Please contact your TA.',
  },
  zh: {
    eyebrow: '准备出发 · 你的校园采集任务', title1: '换个视角，', title2: '看见校园。',
    lead: '一个字母，一个地点，一张属于你的全景图。',
    intro: '为 OpenCV 图像拼接任务抽取拍摄地点。每个学号共有 3 次抽取机会，确定后的字母就是你的最终任务。',
    studentLabel: '输入你的学号', inputHint: '请使用本人 8 位学号。再次输入会显示已保存的抽取结果。',
    submit: '获取我的地点', ticketLabel: '校园影像采集通行证', ready: '准备好，就出发',
    emptyTitle: '你的拍摄地点，等待揭晓', emptyCopy: '输入学号，抽取你的第一个字母。',
    confirm: '确定并锁定', decisionNote: '换一个会替换当前字母，不能选回之前的结果。',
    lockedNote: '已保存。你的最终地点已锁定。', receipt: '下载地点凭证 ↓',
    caption: '抽一个字母，发现校园的另一面。', rulesTitle: '出发前，记住这三件事',
    rule1Title: '一共三次机会', rule1Copy: '首次抽取后，还可以换两次。同一学号不会重复抽到之前的字母。',
    rule2Title: '确定后，就不能换了', rule2Copy: '任何一次点击“确定并锁定”即为最终结果。第三次自动锁定，刷新页面不会重置机会。',
    rule3Title: '去拍摄，然后拼接', rule3Copy: '根据课程地点表找到字母对应的位置。为 Q6 拍摄三张重叠照片，以及一张地点证明照片。',
    footer: '走近一点，换个角度。', busy: '正在保存你的抽取结果…', checking: '正在查询已保存的结果…',
    firstStatus: '第 {used} / 3 次 · 由你决定', finalStatus: '最终地点 · 已锁定',
    location: '拍摄地点 {letter}', finalLocation: '你的最终地点：{letter}',
    remaining: '还可以换 {remaining} 次。保留当前字母，或再试一次。',
    lastChance: '还可以换 1 次。下一次抽取后将自动锁定。',
    confirmedCopy: '你已确定这个字母，不能再更换。', exhaustedCopy: '第三次抽取已自动锁定，不能再更换。',
    redraw: '换一个', lastRedraw: '最后一次 · 抽完即锁定',
    restored: '已恢复保存的结果，没有消耗抽取次数。',
    drawn: '第 {used} 次结果已保存。你可以确定，或换一个。',
    locked: '地点 {letter} 已锁定，请保留凭证用于 Q6。',
    newId: '这个学号还没有抽取记录，点击“获取我的地点”开始。',
    invalid: '请输入你本人的 8 位数字学号。',
    changed: '这个学号刚刚在另一个页面更新，现已显示最新保存结果。',
    alreadyLocked: '这个学号已锁定，现已显示最终地点。',
    network: '无法连接服务器，请检查网络后重试。',
    recovered: '刚才连接中断，现已查询到保存的记录。请查看结果后再操作。',
    server: '这次操作未能完成，请重试。', drawFirst: '请先抽取字母，再点击确定。',
    notConfigured: '抽签服务尚未配置完成，请联系 TA。',
  },
};

function remember(key, value) { try { sessionStorage.setItem(key, value); } catch { /* Optional convenience only. */ } }
function recalled(key) { try { return sessionStorage.getItem(key); } catch { return null; } }
let language = recalled('campus-language') === 'zh' ? 'zh' : 'en';
let state = null;
let busy = false;
let notice = { key: '', args: {}, error: false };
function t(key, args = {}) {
  return (copy[language][key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(args[name] ?? ''));
}

function showNotice(key, args = {}, error = false) {
  notice = { key, args, error };
  $('notice').textContent = key ? t(key, args) : '';
  $('notice').classList.toggle('error', error);
}

function render() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  $('language').textContent = language === 'en' ? '中文 ↗' : 'EN ↗';
  $('language').setAttribute('aria-label', language === 'en' ? '切换到中文' : 'Switch to English');
  $('student-id').placeholder = language === 'en' ? 'e.g. 25023028' : '例如 25023028';
  $('ticket').classList.toggle('has-result', Boolean(state?.drawsUsed));
  $('ticket').classList.toggle('is-locked', Boolean(state?.locked));
  $('letter').textContent = state?.letter ?? '?';
  $('letter').classList.toggle('is-empty', !state?.letter);
  $('status-label').textContent = !state?.drawsUsed ? t('ready')
    : state.locked ? t('finalStatus') : t('firstStatus', { used: state.drawsUsed });
  $('assignment-title').textContent = !state?.drawsUsed ? t('emptyTitle')
    : t(state.locked ? 'finalLocation' : 'location', { letter: state.letter });
  $('assignment-copy').textContent = !state?.drawsUsed ? t('emptyCopy')
    : state.locked ? t(state.lockReason === 'confirmed' ? 'confirmedCopy' : 'exhaustedCopy')
      : state.drawsUsed === 2 ? t('lastChance') : t('remaining', { remaining: state.remainingDraws });
  for (let i = 1; i <= 3; i++) {
    const slot = $(`slot-${i}`);
    const draw = state?.history.find(item => item.attempt === i);
    slot.querySelector('.slot-letter').textContent = draw?.letter ?? '—';
    slot.classList.toggle('used', Boolean(draw));
    slot.classList.toggle('current', Boolean(draw) && i === state.drawsUsed);
    slot.classList.toggle('past', Boolean(draw) && i < state.drawsUsed);
  }
  $('ticket-student').textContent = `${language === 'zh' ? '学号' : 'STUDENT'} ${state?.studentId ?? '—'}`;
  $('ticket-counter').textContent = `${state?.drawsUsed ?? 0} / 3 ${language === 'zh' ? '次' : 'DRAWS'}`;
  $('draw-actions').hidden = !state?.drawsUsed || state.locked;
  $('locked-actions').hidden = !state?.locked;
  $('redraw-text').textContent = t(state?.drawsUsed === 2 ? 'lastRedraw' : 'redraw');
  for (const id of ['submit', 'student-id', 'redraw', 'confirm', 'receipt']) $(id).disabled = busy;
  $('student-form').setAttribute('aria-busy', String(busy));
  showNotice(notice.key, notice.args, notice.error);
}

async function api(action, studentId, expectedRevision) {
  const response = await requestAssignment(action, studentId, expectedRevision);
  const data = await response.json();
  if (!response.ok || data.error) {
    const error = new Error(data.error ?? 'SERVER_ERROR');
    error.code = data.error ?? 'SERVER_ERROR';
    error.state = data.state;
    throw error;
  }
  return data.state;
}

function applyState(next) {
  const changedLetter = next.letter !== state?.letter;
  state = next;
  render();
  if (changedLetter && next.letter) {
    $('letter').classList.remove('reveal');
    void $('letter').offsetWidth;
    $('letter').classList.add('reveal');
  }
}

async function handleFailure(error, studentId) {
  if (error.state) {
    applyState(error.state);
    showNotice(error.code === 'ALREADY_LOCKED' ? 'alreadyLocked'
      : error.code === 'DRAW_FIRST' ? 'drawFirst' : 'changed');
    return;
  }
  if (error.code) {
    showNotice(error.code === 'INVALID_STUDENT_ID' ? 'invalid'
      : error.code === 'NOT_CONFIGURED' ? 'notConfigured' : 'server', {}, true);
    return;
  }
  // A timeout might have happened after a successful write. Recover by reading;
  // never automatically repeat a draw or confirmation.
  try {
    applyState(await api('lookup', studentId));
    showNotice('recovered');
  } catch { showNotice('network', {}, true); }
}

async function loadStudent(studentId, drawIfNew) {
  if (busy) return;
  busy = true;
  showNotice('checking');
  render();
  try {
    let next = await api('lookup', studentId);
    if (!next.drawsUsed && drawIfNew) {
      next = await api('draw', studentId, next.revision);
      applyState(next);
      showNotice('drawn', { used: next.drawsUsed });
    } else {
      applyState(next);
      showNotice(next.drawsUsed ? 'restored' : 'newId');
    }
  } catch (error) { await handleFailure(error, studentId); }
  finally { busy = false; render(); }
}

async function changeAssignment(action) {
  if (busy || !state?.drawsUsed || state.locked) return;
  const studentId = state.studentId;
  const revision = state.revision;
  busy = true;
  showNotice('busy');
  render();
  try {
    applyState(await api(action, studentId, revision));
    showNotice(state.locked ? 'locked' : 'drawn', { letter: state.letter, used: state.drawsUsed });
  } catch (error) { await handleFailure(error, studentId); }
  finally { busy = false; render(); }
}

$('student-form').addEventListener('submit', event => {
  event.preventDefault();
  if (busy) return;
  const studentId = $('student-id').value.trim();
  if (!/^\d{8}$/.test(studentId)) {
    $('student-id').setAttribute('aria-invalid', 'true');
    showNotice('invalid', {}, true);
    $('student-id').focus();
    return;
  }
  $('student-id').removeAttribute('aria-invalid');
  remember('campus-student', studentId);
  loadStudent(studentId, true);
});
$('student-id').addEventListener('input', () => {
  $('student-id').removeAttribute('aria-invalid');
  if ($('student-id').value.trim() !== state?.studentId) {
    state = null;
    showNotice('');
    render();
  }
});
$('redraw').addEventListener('click', () => changeAssignment('draw'));
$('confirm').addEventListener('click', () => changeAssignment('confirm'));
$('language').addEventListener('click', () => {
  language = language === 'en' ? 'zh' : 'en';
  remember('campus-language', language);
  render();
});
$('receipt').addEventListener('click', () => {
  if (!state?.locked) return;
  const receipt = [
    'Perception Robotics — Lab 1 / Question 6', 'FINAL LOCATION ASSIGNMENT', '',
    `Student ID: ${state.studentId}`, `Location letter: ${state.letter}`,
    `Draws used: ${state.drawsUsed} / 3`, `History: ${state.history.map(draw => draw.letter).join(' → ')}`,
    `Locked by: ${state.lockReason === 'confirmed' ? 'Student confirmation' : 'Third draw (automatic)'}`,
    `Locked at (UTC): ${state.lockedAt}`, '',
    'Match this letter to the course location list. Server records are authoritative.',
  ].join('\n');
  const url = URL.createObjectURL(new Blob([receipt], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Q6_${state.studentId}_${state.letter}.txt`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !busy && state?.studentId === $('student-id').value.trim()) {
    loadStudent(state.studentId, false);
  }
});
render();
const previousId = recalled('campus-student');
if (previousId && /^\d{8}$/.test(previousId)) {
  $('student-id').value = previousId;
  loadStudent(previousId, false);
}
