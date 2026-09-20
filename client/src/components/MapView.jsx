import { useEffect, useRef } from 'react';
import { ROUTE_D, pointAt } from '../route.js';
import { level } from '../utils.js';

const LABEL = {
  up: [0, -24, 'middle'],
  down: [0, 34, 'middle'],
  left: [-30, 5, 'end'],
  right: [30, 5, 'start']
};
const STREETS = [
  [210, 80, 210, 310], [360, 80, 360, 420], [540, 80, 540, 230], [70, 160, 710, 160],
  [70, 260, 500, 260], [500, 330, 760, 330], [600, 230, 600, 440]
];

export default function MapView({ bins, progressNow }) {
  const truck = useRef(null);

  // Truck 12 is drawn from the position the server reports, smoothed between updates.
  useEffect(() => {
    const place = () => {
      const p = pointAt(progressNow());
      if (truck.current) {
        truck.current.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.ang.toFixed(1)})`);
      }
    };
    place();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = setInterval(place, 1000);
      return () => clearInterval(id);
    }
    let raf = requestAnimationFrame(function loop() {
      place();
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [progressNow]);

  return (
    <figure className="map">
      <div className="map-scroll">
        <svg
          viewBox="0 0 760 480"
          role="img"
          aria-label="Live map of Ward 7 showing the bins and Truck 12 on its route. The table below lists the same bins."
        >
          <rect x="0" y="0" width="760" height="480" fill="var(--block)" />
          <path d="M-10 462 Q200 478 400 462 T780 456" className="m-water" strokeWidth="16" />
          <rect x="520" y="100" width="100" height="100" rx="8" className="m-park" />
          <text x="570" y="154" className="m-tag">Park</text>
          {STREETS.map((s, i) => (
            <line key={i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} className="m-street" strokeWidth="9" />
          ))}
          <path d={ROUTE_D} className="m-road" />
          <path d={ROUTE_D} className="m-dash" />

          {bins.map((b) => {
            const p = pointAt(b.at);
            const l = level(b.fill);
            const pos = LABEL[b.label] || LABEL.up;
            return (
              <g key={b.code} className="m-bin" transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
                <title>{`${b.code}, ${b.area}: ${b.fill}% full`}</title>
                <rect x="-21" y="-14" width="42" height="28" rx="7" className={'b-' + l} />
                <text className={'m-pct t-' + l} x="0" y="1">{b.fill}%</text>
                <text className="m-label" x={pos[0]} y={pos[1]} textAnchor={pos[2]}>{b.area}</text>
              </g>
            );
          })}

          <g ref={truck} className="m-truck">
            <title>Truck 12</title>
            <rect className="body" x="-15" y="-8" width="20" height="16" rx="3" />
            <rect className="cab" x="6" y="-7" width="9" height="14" rx="3" />
          </g>
        </svg>
      </div>
      <figcaption className="legend">
        <span><i className="b-ok" />Under 60% full</span>
        <span><i className="b-warn" />60 to 84% full</span>
        <span><i className="b-bad" />85% or more</span>
        <span><i className="truck-key" />Truck 12</span>
      </figcaption>
    </figure>
  );
}
