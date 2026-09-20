import { useEffect, useState } from 'react';
import { EVENT_LABEL, STATUS, STATUS_LABEL, ago, clock } from '../utils.js';
import { useTicker } from '../useLive.js';

function Row({ r, open, highlighted, isAdmin, onToggle, onAdvance }) {
  const i = STATUS.indexOf(r.status);
  return (
    <li className={'req' + (r.status === 'collected' ? ' done' : '') + (highlighted ? ' hl' : '')}>
      <button
        type="button"
        id={'h-' + r.code}
        className="req-head"
        aria-expanded={open}
        aria-controls={'d-' + r.code}
        onClick={onToggle}
      >
        <span className="rid">{r.code}</span>
        <span className="rwhat">
          <strong>{r.area}</strong>
          <span className="rtype">{r.type === 'E-waste' ? 'E-waste' : r.type + ' waste'}</span>
        </span>
        <span className="rstat">
          <span className="steps" role="img" aria-label={`Step ${i + 1} of 4`}>
            {STATUS.map((s, k) => <i key={s} className={k <= i ? 'on' : ''} />)}
          </span>
          <span className="rlab">{STATUS_LABEL[r.status]}</span>
        </span>
        <span className="rtime">{ago(r.createdAt)}</span>
      </button>
      <div className="req-body" id={'d-' + r.code} hidden={!open}>
        <p className="note">{r.note}</p>
        <ol className="timeline">
          {r.events.map((e) => (
            <li key={e.status}><time>{clock(e.at)}</time><span>{EVENT_LABEL[e.status]}</span></li>
          ))}
        </ol>
        {isAdmin && i < STATUS.length - 1 && (
          <button type="button" className="btn sec2" onClick={onAdvance}>Advance status</button>
        )}
      </div>
    </li>
  );
}

export default function TrackList({ reports, highlight, isAdmin, onAdvance }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());
  useTicker(30000);

  useEffect(() => {
    if (highlight) setExpanded((s) => new Set(s).add(highlight));
  }, [highlight]);

  const q = query.trim().toLowerCase();
  const list = reports.filter((r) => {
    if (filter === 'open' && r.status === 'collected') return false;
    if (filter === 'done' && r.status !== 'collected') return false;
    return !q || r.code.toLowerCase().includes(q) || r.area.toLowerCase().includes(q);
  });

  function toggle(code) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function advance(code) {
    await onAdvance(code);
    const head = document.getElementById('h-' + code);
    if (head) head.focus();
  }

  return (
    <section aria-labelledby="h-track">
      <div className="wrap">
        <div className="pagehead">
          <h1 id="h-track" tabIndex={-1}>Track requests</h1>
          <p>
            {isAdmin
              ? 'You are signed in as an admin, so you see every request and can advance its status.'
              : 'These are the reports you filed. Each one moves through four steps. Open a request to see its timeline.'}
          </p>
        </div>

        <div className="tools">
          <div className="search">
            <label className="lbl" htmlFor="q" style={{ marginBottom: 4 }}>Search by ID or area</label>
            <input
              id="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="WM-1040 or Sabzi Mandi"
              autoComplete="off"
            />
          </div>
          <div className="chips" role="group" aria-label="Filter requests">
            {[['all', 'All'], ['open', 'Open'], ['done', 'Collected']].map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
        </div>

        <ul className="reqs">
          {list.map((r) => (
            <Row
              key={r.code}
              r={r}
              open={expanded.has(r.code)}
              highlighted={r.code === highlight}
              isAdmin={isAdmin}
              onToggle={() => toggle(r.code)}
              onAdvance={() => advance(r.code)}
            />
          ))}
        </ul>
        {list.length === 0 && (
          <div className="empty">No requests match. Clear the search, or <a href="#report">report waste</a>.</div>
        )}
      </div>
    </section>
  );
}
