import { requestAssignment } from './transport.js';
import { LOCATIONS } from './locations.js';
import { setMapLocation } from './map.js';
const $ = id => document.getElementById(id);
const copy = {
  en: {
    navAssignment:'Assignment', navMap:'Campus map', title:'Your campus. A new perspective.',
    subtitle:'One draw. One unique location. A full 360° panorama.', round:'45 locations',
    studentLabel:'STUDENT ID', draw:'Draw my location', view:'View saved location',
    placeholder:'Enter your 8-digit student ID', inputHint:'Use your own student ID. Already drawn? Enter it again to view your saved location.',
    mapTitle:'PolyU campus map', mapSubtitle:'Hung Hom campus', mapLegend:'Your location',
    mapHint:'Drag to move · + / − to zoom · The pin marks your assigned landmark.',
    mapDescription:'Draw a location to see it highlighted on the map. Use the zoom controls or drag to explore.',
    zoomIn:'Zoom in', zoomOut:'Zoom out', mapFit:'Show campus', mapLocate:'Zoom to my location',
    resultLabel:'YOUR ASSIGNMENT', emptyTitle:'A place of your own.', emptyCopy:'Your location will appear here and on the map.',
    saved:'ASSIGNED · 1 / 1 DRAW', openMap:'Open official map', finalCopy:'Saved permanently. No redraws.', receipt:'Download receipt ↓', poolLabel:'LOCATIONS REMAINING',
    rule1Title:'One student, one location.', rule1:'Assigned randomly. No shared locations or redraws.',
    rule2Title:'Capture the full 360°.', rule2:'Take at least 12 overlapping photos from one position.',
    rule3Title:'Include your student card.', rule3:'Show your physical card in one original photo.',
    checking:'Checking your saved assignment…', drawing:'Assigning your location…',
    drawn:'Location {id} is yours. Your one draw is complete.', restored:'Your saved location is shown. No new draw was used.',
    invalid:'Enter your own 8-digit student ID.', exhausted:'All 45 locations have been assigned. Contact your TA.',
    network:'Could not reach the assignment service. Check your connection and try again.',
    recovered:'Your assignment was saved. The saved result has been restored.',
    notConfigured:'The new draw is not open yet. Please contact your TA.',
    server:'The request could not be completed. Please try again.', student:'Student',
  },
  zh: {
    navAssignment:'抽签', navMap:'校园地图', title:'你的校园，新的视角。',
    subtitle:'一次抽签，一个专属地点，一张 360° 全景。', round:'45 个地点',
    studentLabel:'学生学号', draw:'抽取我的地点', view:'查看已分配地点',
    placeholder:'输入本人 8 位学号', inputHint:'请使用本人学号。已经抽过？再次输入即可查看已保存的地点。',
    mapTitle:'PolyU 校园地图', mapSubtitle:'红磡校园', mapLegend:'你的地点',
    mapHint:'拖动地图 · + / − 缩放 · 标记显示分配给你的地标位置。',
    mapDescription:'抽签后，地图会标出你的地点。可拖动地图或使用缩放按钮。',
    zoomIn:'放大地图', zoomOut:'缩小地图', mapFit:'显示整个校园', mapLocate:'定位我的地点',
    resultLabel:'你的拍摄地点', emptyTitle:'一个属于你的地点。', emptyCopy:'抽签结果将在这里和地图上显示。',
    saved:'已分配 · 1 / 1 次', openMap:'打开官方地图', finalCopy:'结果已保存，不能重新抽签。', receipt:'下载抽签凭证 ↓', poolLabel:'剩余地点',
    rule1Title:'一人一处，不重复。', rule1:'随机分配，每人仅有一次抽签机会。',
    rule2Title:'拍摄完整 360°。', rule2:'固定机位，拍摄至少 12 张有重叠的照片。',
    rule3Title:'带上你的学生证。', rule3:'至少一张原片中须出现实体学生证。',
    checking:'正在查询已保存的地点…', drawing:'正在分配你的地点…',
    drawn:'地点 {id} 已分配给你。本次抽签已完成。', restored:'已显示保存的地点，没有重新抽签。',
    invalid:'请输入本人 8 位数字学号。', exhausted:'45 个地点已全部分配，请联系 TA。',
    network:'无法连接抽签服务，请检查网络后重试。', recovered:'抽签结果已保存，现已恢复显示。',
    notConfigured:'新一轮抽签尚未开放，请联系 TA。', server:'操作未完成，请重试。', student:'学号',
  },
};
const remember = (key,value) => { try { sessionStorage.setItem(key,value); } catch {} };
const recall = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
let language = recall('campus-language') === 'zh' ? 'zh' : 'en';
let state = null, busy = false, notice = { key:'', args:{}, error:false };
function t(key,args={}) { return (copy[language][key] ?? key).replace(/\{(\w+)\}/g,(_,k)=>String(args[k]??'')); }
function showNotice(key,args={},error=false) { notice={key,args,error}; $('notice').textContent=t(key,args); $('notice').classList.toggle('error',error); $('notice').classList.toggle('pending',busy); }
function render() {
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  document.querySelectorAll('[data-i18n]').forEach(n=>{n.textContent=t(n.dataset.i18n);});
  $('language').textContent=language==='en'?'中文':'EN';
  $('language').setAttribute('aria-label',language==='en'?'切换到中文':'Switch to English');
  $('student-id').placeholder=t('placeholder');
  const location=LOCATIONS.find(l=>l.id===state?.locationId);
  $('empty-result').hidden=Boolean(location); $('saved-result').hidden=!location;
  $('pool-count').textContent=`${state?.remainingLocations??'—'} / 45`;
  $('submit').disabled=busy || (state?.remainingLocations===0 && !location);
  $('student-id').disabled=busy; $('receipt').disabled=busy;
  $('student-form').setAttribute('aria-busy',String(busy)); $('submit').classList.toggle('is-busy',busy);
  $('submit').querySelector('.button-label').textContent=t(busy?'drawing':location?'view':'draw');
  if(location) {
    $('location-number').textContent=location.id;
    $('location-name').textContent=language==='zh'?location.nameZh:location.name;
    $('shooting-point').textContent=language==='zh'?location.shootingPointZh:location.shootingPoint;
    $('official-map').href=location.mapUrl;
    $('assigned-student').textContent=`${t('student')} ${state.studentId}`;
  }
  $('map-title').textContent=t('mapTitle');
  $('map-description').textContent=location?`${t('mapLegend')}: ${location.id} ${language==='zh'?location.nameZh:location.name}. ${t('mapHint')}`:t('mapDescription');
  for(const [id,key] of [['zoom-in','zoomIn'],['zoom-out','zoomOut'],['map-fit','mapFit'],['map-locate','mapLocate']]) $(id).setAttribute('aria-label',t(key));
  setMapLocation(location); showNotice(notice.key,notice.args,notice.error);
}
async function api(action,studentId,revision) {
  const response=await requestAssignment(action,studentId,revision), data=await response.json();
  if(!response.ok || data.error) {
    const error=new Error(data.error??data.code??'SERVER_ERROR');
    error.code=(data.code==='PGRST202'||response.status===404)?'NOT_CONFIGURED':data.error??data.code??'SERVER_ERROR';
    error.state=data.state; throw error;
  }
  if(!data.state || data.state.studentId!==studentId || data.state.totalLocations!==45 ||
    (data.state.locationId!==null && !LOCATIONS.some(l=>l.id===data.state.locationId))) {
    const e=new Error('Invalid assignment response');e.code='SERVER_ERROR';throw e;
  }
  return data.state;
}
async function loadStudent(studentId,drawIfNew) {
  if(busy)return; busy=true;showNotice('checking');render();
  try {
    let next=await api('lookup',studentId);
    if(!next.locked && drawIfNew && next.remainingLocations>0) {
      showNotice('drawing'); next=await api('draw',studentId,0);
      state=next;showNotice('drawn',{id:next.locationId});
    } else { state=next;showNotice(next.locked?'restored':next.remainingLocations===0?'exhausted':'',{},!next.locked&&next.remainingLocations===0); }
    remember('campus-student-v2',studentId);
  } catch(error) {
    if(error.state)state=error.state;
    if(error.code) showNotice(error.code==='INVALID_STUDENT_ID'?'invalid':error.code==='POOL_EXHAUSTED'?'exhausted':error.code==='NOT_CONFIGURED'?'notConfigured':'server',{},true);
    else {
      // A lost response may follow a committed draw. Recover with a read only.
      try {state=await api('lookup',studentId);showNotice(state.locked?'recovered':'network',{},!state.locked);}
      catch{showNotice('network',{},true);}
    }
  } finally {busy=false;render();}
}
$('student-form').addEventListener('submit',e=>{
  e.preventDefault();if(busy)return;
  const studentId=$('student-id').value.trim();
  if(!/^\d{8}$/.test(studentId)){$('student-id').setAttribute('aria-invalid','true');showNotice('invalid',{},true);$('student-id').focus();return;}
  $('student-id').removeAttribute('aria-invalid');loadStudent(studentId,true);
});
$('student-id').addEventListener('input',()=>{
  $('student-id').removeAttribute('aria-invalid');
  if(state && $('student-id').value.trim()!==state.studentId){state=null;showNotice('');render();}
});
$('language').addEventListener('click',()=>{language=language==='en'?'zh':'en';remember('campus-language',language);render();});
$('receipt').addEventListener('click',()=>{
  const location=LOCATIONS.find(l=>l.id===state?.locationId);if(!location)return;
  const content=['Campus Draw — Lab 1 / Question 5','Round: 45 unique campus locations (v2)',`Student ID: ${state.studentId}`,`Location: ${location.id} — ${location.name}`,`地点: ${location.nameZh}`,`Shooting point: ${location.shootingPoint}`,`Map: ${location.mapUrl}`,`Assigned at (UTC): ${state.assignedAt}`,'Draws used: 1 / 1. Final assignment. No redraws.',''].join('\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=`Q5_${state.studentId}_location-${location.id}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
render();
const previous=recall('campus-student-v2');if(previous&&/^\d{8}$/.test(previous)){$('student-id').value=previous;loadStudent(previous,false);}
