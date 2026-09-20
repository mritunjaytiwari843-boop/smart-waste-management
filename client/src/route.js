// Shape of Truck 12's loop, in map units (the map is 760 x 480).
// Bins and the truck sit on this line; positions come from the API as 0..1.
const OPS = [
  ['L', 690, 80], ['Q', 710, 80, 710, 100], ['L', 710, 210], ['Q', 710, 230, 690, 230], ['L', 520, 230],
  ['Q', 500, 230, 500, 250], ['L', 500, 400], ['Q', 500, 420, 480, 420], ['L', 250, 420], ['Q', 230, 420, 230, 400],
  ['L', 230, 330], ['Q', 230, 310, 210, 310], ['L', 90, 310], ['Q', 70, 310, 70, 290], ['L', 70, 80]
];

export const pts = [[70, 80]];
(() => {
  let cx = 70;
  let cy = 80;
  OPS.forEach((o) => {
    if (o[0] === 'L') {
      pts.push([o[1], o[2]]);
      cx = o[1];
      cy = o[2];
    } else {
      for (let i = 1; i <= 6; i++) {
        const t = i / 6;
        const u = 1 - t;
        pts.push([u * u * cx + 2 * u * t * o[1] + t * t * o[3], u * u * cy + 2 * u * t * o[2] + t * t * o[4]]);
      }
      cx = o[3];
      cy = o[4];
    }
  });
})();

const cum = [0];
for (let i = 1; i < pts.length; i++) {
  cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
}
export const L = cum[cum.length - 1];

export const ROUTE_D = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z';

// Point on the route at a fraction (0..1) of its length, with the direction of travel.
export function pointAt(fraction) {
  const dist = (((fraction * L) % L) + L) % L;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < dist) i++;
  const seg = cum[i] - cum[i - 1] || 1;
  const t = (dist - cum[i - 1]) / seg;
  const a = pts[i - 1];
  const b = pts[i];
  return {
    x: a[0] + (b[0] - a[0]) * t,
    y: a[1] + (b[1] - a[1]) * t,
    ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
  };
}
