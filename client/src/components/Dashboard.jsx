import MapView from './MapView.jsx';
import { binStatus, clock, dur, level, TYPES } from '../utils.js';

function Kpis({ stats, bins }) {
  const full = bins.filter((b) => b.fill >= 80).length;
  return (
    <section className="sec" aria-labelledby="h-now">
      <h2 id="h-now">Right now</h2>
      <dl className="kpi">
        <div><dt>Open reports</dt><dd>{stats.openReports}</dd></div>
        <div><dt>Bins at 80% or more</dt><dd>{full}</dd></div>
        <div><dt>Collected today</dt><dd>{stats.collectedToday}</dd></div>
        <div>
          <dt>Average pickup time</dt>
          <dd>{stats.avgPickupMinutes == null ? <small>No data yet</small> : dur(stats.avgPickupMinutes)}</dd>
        </div>
      </dl>
    </section>
  );
}

function Feed({ feed }) {
  return (
    <section className="sec" aria-labelledby="h-feed">
      <h2 id="h-feed">Activity</h2>
      <ol className="feed">
        {feed.map((f) => (
          <li key={f.t + f.text}>
            <time>{clock(f.t)}</time>
            <span>{f.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WeekChart({ week }) {
  const max = Math.max(60, Math.ceil(Math.max(...week.map((w) => w.count)) / 10) * 10);
  const bw = 42;
  const gap = 14;
  const x0 = (420 - (7 * bw + 6 * gap)) / 2;
  const base = 176;
  return (
    <section className="sec" aria-labelledby="h-week">
      <h2 id="h-week">Collections in the last 7 days</h2>
      <svg className="week" viewBox="0 0 420 206" role="img" aria-label="Bar chart of daily bin collections for the last seven days">
        <line x1="8" x2="412" y1={base} y2={base} stroke="var(--line)" strokeWidth="2" />
        {week.map((w, i) => {
          const h = Math.round((w.count / max) * 140);
          const x = x0 + i * (bw + gap);
          const today = i === week.length - 1;
          const day = today ? 'Today' : new Date(w.date).toLocaleDateString('en-IN', { weekday: 'short' });
          return (
            <g key={w.date}>
              <rect x={x} y={base - h} width={bw} height={h} rx="3" fill={today ? 'var(--hivis)' : 'var(--bar)'} />
              <text className="val" x={x + bw / 2} y={base - h - 7} textAnchor="middle" fontSize="13">{w.count}</text>
              <text x={x + bw / 2} y="196" textAnchor="middle" fontSize="12.5">{day}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function TypeBars({ types }) {
  const max = Math.max(1, ...TYPES.map((t) => types[t] || 0));
  return (
    <section className="sec" aria-labelledby="h-types">
      <h2 id="h-types">Reports by waste type</h2>
      <ul className="types">
        {TYPES.map((t) => (
          <li key={t}>
            <span>{t}</span>
            <span className="tbar"><i style={{ width: Math.round(((types[t] || 0) / max) * 100) + '%' }} /></span>
            <span className="tn">{types[t] || 0}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BinTable({ bins }) {
  const sorted = bins.slice().sort((a, b) => b.fill - a.fill);
  return (
    <section className="sec" aria-labelledby="h-bins">
      <h2 id="h-bins">All bins</h2>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Bin</th><th scope="col">Area</th><th scope="col">Waste</th>
              <th scope="col">Fill level</th><th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => (
              <tr key={b.code}>
                <td>{b.code}</td>
                <td>{b.area}</td>
                <td>{b.type}</td>
                <td>
                  <span className="fbar"><i className={'b-' + level(b.fill)} style={{ width: b.fill + '%' }} /></span>
                  <span className="fpct">{b.fill}%</span>
                </td>
                <td>{binStatus(b.fill)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Dashboard({ live }) {
  const { bins, feed, stats, progressNow } = live;
  return (
    <section aria-labelledby="h-dash">
      <div className="wrap">
        <div className="pagehead">
          <h1 id="h-dash" tabIndex={-1}>Ward 7 collection status</h1>
          <p>Bin levels and the truck's position update live. Bins under 40% full are skipped to save trips.</p>
        </div>
        <div className="dash">
          <MapView bins={bins} progressNow={progressNow} />
          <aside className="side">
            <Kpis stats={stats} bins={bins} />
            <Feed feed={feed} />
          </aside>
        </div>
        <div className="two">
          <WeekChart week={stats.week} />
          <TypeBars types={stats.types} />
        </div>
        <BinTable bins={bins} />
      </div>
    </section>
  );
}
