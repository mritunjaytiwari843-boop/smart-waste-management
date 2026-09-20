import { useState } from 'react';

export default function AuthPage({ auth, notice, onDone }) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (register && name.trim().length < 2) return setError('Enter your name.');
    if (!email.trim()) return setError('Enter your email address.');
    if (password.length < (register ? 8 : 1)) {
      return setError(register ? 'Password must be at least 8 characters.' : 'Enter your password.');
    }
    setBusy(true);
    try {
      if (register) await auth.register(name.trim(), email.trim(), password);
      else await auth.login(email.trim(), password);
      setPassword('');
      if (onDone) onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="h-auth">
      <div className="wrap">
        <div className="pagehead">
          <h1 id="h-auth" tabIndex={-1}>{register ? 'Create an account' : 'Sign in'}</h1>
          <p>An account lets you report waste and follow your own requests.</p>
        </div>
        <div className="authbox">
          {notice && <div className="notice">{notice}</div>}
          <div className="tabs" role="group" aria-label="Sign in or create an account">
            <button type="button" aria-pressed={!register} onClick={() => { setMode('signin'); setError(''); }}>Sign in</button>
            <button type="button" aria-pressed={register} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
          </div>
          <form onSubmit={submit} noValidate>
            {register && (
              <div className="field">
                <label className="lbl" htmlFor="name">Name</label>
                <input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="field">
              <label className="lbl" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={register ? 'pwHint' : undefined}
              />
              {register && <div className="hint" id="pwHint">At least 8 characters.</div>}
            </div>
            <div className="err" role="alert">{error}</div>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Please wait' : register ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
