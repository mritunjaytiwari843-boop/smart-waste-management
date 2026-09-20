export const STATUS = ['reported', 'assigned', 'onway', 'collected'];
export const STATUS_LABEL = { reported: 'Reported', assigned: 'Assigned', onway: 'On the way', collected: 'Collected' };
export const EVENT_LABEL = {
  reported: 'Report received',
  assigned: 'Assigned to Truck 12',
  onway: 'Truck 12 is on the way',
  collected: 'Waste collected'
};
export const TYPES = ['Wet', 'Dry', 'Mixed', 'Hazardous', 'E-waste'];
export const SKIP_BELOW = 40;

export function ago(ts) {
  const s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h + ' h' + (r ? ' ' + r + ' min' : '') + ' ago';
}

export function clock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function dur(min) {
  const m = Math.round(min);
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h + ' h' + (r ? ' ' + r + ' min' : '');
}

export function level(fill) {
  return fill >= 85 ? 'bad' : fill >= 60 ? 'warn' : 'ok';
}

export function binStatus(fill) {
  if (fill >= 85) return 'Full';
  if (fill >= 60) return 'Filling up';
  if (fill >= SKIP_BELOW) return 'Half full';
  return 'Low, will be skipped';
}
