import { useRef, useState } from 'react';
import { api } from '../api.js';
import { TYPES } from '../utils.js';

const STEPS = [
  ['Reported', 'Your report reaches the control room.'],
  ['Assigned', 'A truck is picked for your area.'],
  ['On the way', "The truck's next stop is your area."],
  ['Collected', 'The waste is picked up and the report closes.']
];

export default function ReportForm({ areas, onCreated }) {
  const [type, setType] = useState('Mixed');
  const [area, setArea] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const areaRef = useRef(null);
  const noteRef = useRef(null);

  async function submit(e) {
    e.preventDefault();
    const next = {};
    if (!area) next.area = 'Choose an area so the truck knows where to go.';
    if (note.trim().length < 10) next.note = 'Describe the waste in at least 10 characters.';
    setErrors(next);
    setServerError('');
    if (next.area) return areaRef.current.focus();
    if (next.note) return noteRef.current.focus();

    setBusy(true);
    try {
      const report = await api.createReport({ type, area, note: note.trim() });
      setType('Mixed');
      setArea('');
      setNote('');
      onCreated(report);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="h-report">
      <div className="wrap">
        <div className="pagehead">
          <h1 id="h-report" tabIndex={-1}>Report waste</h1>
          <p>Tell us what needs collecting and where. You get a tracking ID as soon as you submit.</p>
        </div>
        <div className="report">
          <form onSubmit={submit} noValidate>
            <fieldset>
              <legend>Type of waste</legend>
              <div className="pills">
                {TYPES.map((t) => (
                  <label key={t}>
                    <input type="radio" name="wtype" value={t} checked={type === t} onChange={() => setType(t)} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="field">
              <label className="lbl" htmlFor="area">Area</label>
              <select
                id="area"
                ref={areaRef}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                aria-invalid={errors.area ? 'true' : undefined}
                aria-describedby="areaErr"
              >
                <option value="">Choose an area</option>
                {areas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <div className="err" id="areaErr" role="alert">{errors.area}</div>
            </div>

            <div className="field">
              <label className="lbl" htmlFor="note">What needs collecting?</label>
              <textarea
                id="note"
                ref={noteRef}
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Example: Bin outside shop 14 is overflowing onto the road."
                aria-invalid={errors.note ? 'true' : undefined}
                aria-describedby="noteHint noteErr"
              />
              <div className="hint" id="noteHint">Mention the exact spot, such as a shop number or landmark.</div>
              <div className="err" id="noteErr" role="alert">{errors.note}</div>
            </div>

            {serverError && <div className="err-box" role="alert">{serverError}</div>}
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Submitting' : 'Submit report'}</button>
          </form>

          <section className="sec" aria-labelledby="h-flow">
            <h2 id="h-flow">What happens next</h2>
            <ol className="flow" style={{ marginTop: 18 }}>
              {STEPS.map(([title, text]) => (
                <li key={title}><b>{title}</b><span>{text}</span></li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}
