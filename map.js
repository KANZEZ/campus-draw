import { MAP } from './locations.js';
const svg = document.getElementById('map-svg');
const pin = document.getElementById('map-pin');
let selected = null;
function render() {
  pin.setAttribute('visibility', selected ? 'visible' : 'hidden');
  if (!selected) { pin.removeAttribute('data-location-id'); return; }
  const n = 2 ** MAP.zoom, lat = selected.latitude * Math.PI / 180;
  const x = ((selected.longitude + 180) / 360 * n - MAP.tileX) * 256;
  const y = ((1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * n - MAP.tileY) * 256;
  const pixelsPerUnit = Math.min(svg.clientWidth / MAP.width, svg.clientHeight / MAP.height);
  pin.setAttribute('transform', `translate(${x} ${y}) scale(${.6 / Math.max(pixelsPerUnit, .01)})`);
  pin.setAttribute('data-location-id', selected.id);
}
export function setMapLocation(location) { selected = location ?? null; render(); }
new ResizeObserver(render).observe(svg);
