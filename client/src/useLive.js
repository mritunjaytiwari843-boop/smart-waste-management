import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';

// Loads the first snapshot from the API, then keeps everything current
// through one Server-Sent Events connection (/api/stream).
// Reports are only loaded when someone is signed in: their own, or all for an admin.
export function useLive(enabled, userId) {
  const [state, setState] = useState({ ready: false, error: null, bins: [], feed: [], stats: null });
  const [reports, setReports] = useState([]);
  const [attempt, setAttempt] = useState(0);
  const clock = useRef({ base: 0, at: performance.now(), loop: 34 });

  useEffect(() => {
    if (!enabled) return undefined;
    let dead = false;
    let es = null;

    async function boot() {
      try {
        const [snap, list] = await Promise.all([
          api.state(),
          userId ? api.reports().catch(() => []) : Promise.resolve([])
        ]);
        if (dead) return;
        clock.current = { base: snap.progress, at: performance.now(), loop: snap.loopSeconds };
        setState((p) => ({ ...p, ready: true, error: null, bins: snap.bins, feed: snap.feed, stats: snap.stats }));
        setReports(list);

        es = new EventSource('/api/stream');
        es.addEventListener('tick', (ev) => {
          const d = JSON.parse(ev.data);
          clock.current.base = d.progress;
          clock.current.at = performance.now();
          const fills = new Map(d.bins.map((b) => [b.code, b.fill]));
          setState((p) => ({ ...p, bins: p.bins.map((b) => (fills.has(b.code) ? { ...b, fill: fills.get(b.code) } : b)) }));
        });
        es.addEventListener('activity', (ev) => {
          const item = JSON.parse(ev.data);
          setState((p) => ({ ...p, feed: [item, ...p.feed].slice(0, 8) }));
        });
        es.addEventListener('stats', (ev) => {
          setState((p) => ({ ...p, stats: JSON.parse(ev.data) }));
        });
        es.addEventListener('report', (ev) => {
          const r = JSON.parse(ev.data);
          setReports((list) => {
            const i = list.findIndex((x) => x.code === r.code);
            if (i === -1) return [r, ...list];
            const copy = list.slice();
            copy[i] = r;
            return copy;
          });
        });
      } catch (err) {
        if (!dead) setState((p) => ({ ...p, error: err.message }));
      }
    }

    boot();
    return () => {
      dead = true;
      if (es) es.close();
    };
  }, [attempt, enabled, userId]); // reconnects after signing in or out, so the server sends the right reports

  // Where the truck is right now (0..1), smoothed between server updates.
  const progressNow = useCallback(() => {
    const c = clock.current;
    return (c.base + (performance.now() - c.at) / 1000 / c.loop) % 1;
  }, []);

  const retry = useCallback(() => {
    setState((p) => ({ ...p, error: null }));
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, reports, progressNow, retry };
}

// Re-renders every `ms` so "12 min ago" labels stay fresh.
export function useTicker(ms = 30000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
