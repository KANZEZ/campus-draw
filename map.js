import { LOCATIONS, MAP } from './locations.js';
const svg = document.getElementById('map-svg');
const pin = document.getElementById('map-pin');
const dots = document.getElementById('map-dots');
const ns = 'http://www.w3.org/2000/svg';
export function projectLocation(location) {
  const n = 2 ** MAP.zoom;
  const lat = location.latitude * Math.PI / 180;
  return { x: ((location.longitude + 180) / 360 * n - MAP.tileX) * 256,
    y: ((1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * n - MAP.tileY) * 256 };
}
for (const location of LOCATIONS) {
  const point = projectLocation(location), dot = document.createElementNS(ns, 'circle');
  dot.setAttribute('cx', point.x); dot.setAttribute('cy', point.y); dot.setAttribute('r', '7');
  dot.dataset.locationId = location.id; dots.append(dot);
}
let selected = null, view = null, home = null, drag = null;
function update() {
  svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);
  const unit = view.width / Math.max(svg.clientWidth, 1);
  for (const dot of dots.children) dot.setAttribute('r', 2.7 * unit);
  if (selected) {
    const p = projectLocation(selected);
    pin.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${unit * .74})`);
    pin.setAttribute('data-location-id', selected.id);
  }
  document.getElementById('zoom-in').disabled = view.width <= home.width / 4 + 1;
  document.getElementById('zoom-out').disabled = view.width >= home.width - 1;
}
function fit() { view = { ...home }; update(); }
function zoom(factor, center) {
  const width = Math.max(home.width / 4, Math.min(home.width, view.width * factor));
  const height = width * home.height / home.width;
  const p = center ?? { x: view.x + view.width / 2, y: view.y + view.height / 2 };
  view = { x: p.x - width / 2, y: p.y - height / 2, width, height }; update();
}
function locate() { if (selected) { view = { ...home }; zoom(.55, projectLocation(selected)); } }
new ResizeObserver(() => {
  const ratio = svg.clientWidth / Math.max(svg.clientHeight, 1);
  const height = Math.max(1500, 1500 / ratio), width = height * ratio;
  home = { x: 950 - width / 2, y: 820 - height / 2, width, height };
  selected ? locate() : fit();
}).observe(svg);
export function setMapLocation(location) {
  if (selected?.id === location?.id) return;
  selected = location ?? null;
  pin.setAttribute('visibility', selected ? 'visible' : 'hidden');
  document.getElementById('map-locate').disabled = !selected;
  for (const dot of dots.children) dot.setAttribute('visibility', dot.dataset.locationId === selected?.id ? 'hidden' : 'visible');
  if (selected) document.getElementById('map-pin-label').textContent = selected.id;
  else pin.removeAttribute('data-location-id');
  if (home) selected ? locate() : fit();
}
document.getElementById('zoom-in').addEventListener('click', () => zoom(.75));
document.getElementById('zoom-out').addEventListener('click', () => zoom(1 / .75));
document.getElementById('map-fit').addEventListener('click', fit);
document.getElementById('map-locate').addEventListener('click', locate);
svg.addEventListener('pointerdown', e => {
  if (e.button !== 0 || !view) return;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, view: { ...view } };
  svg.setPointerCapture(e.pointerId); svg.classList.add('is-dragging');
});
svg.addEventListener('pointermove', e => {
  if (!drag || drag.id !== e.pointerId) return;
  const scale = drag.view.width / svg.clientWidth;
  view.x = Math.max(-home.width, Math.min(MAP.width, drag.view.x - (e.clientX - drag.x) * scale));
  view.y = Math.max(-home.height, Math.min(MAP.height, drag.view.y - (e.clientY - drag.y) * scale)); update();
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) svg.addEventListener(event, () => { drag = null; svg.classList.remove('is-dragging'); });
svg.addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15); } }, { passive: false });
svg.addEventListener('keydown', e => {
  if (!view) return;
  if (e.key === '+' || e.key === '=') zoom(.75);
  else if (e.key === '-') zoom(1 / .75);
  else if (e.key === 'Home') fit();
  else if (e.key.startsWith('Arrow')) {
    if (e.key === 'ArrowLeft') view.x -= view.width * .1;
    if (e.key === 'ArrowRight') view.x += view.width * .1;
    if (e.key === 'ArrowUp') view.y -= view.height * .1;
    if (e.key === 'ArrowDown') view.y += view.height * .1;
    update();
  } else return;
  e.preventDefault();
});
