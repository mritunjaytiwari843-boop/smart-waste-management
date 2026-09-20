import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';
import ReportForm from './components/ReportForm.jsx';
import TrackList from './components/TrackList.jsx';
import AuthPage from './components/AuthPage.jsx';
import Toast from './components/Toast.jsx';
import { useLive } from './useLive.js';
import { useAuth } from './useAuth.js';
import { api } from './api.js';
import { STATUS_LABEL } from './utils.js';

const VIEWS = ['dashboard', 'report', 'track', 'login'];

function useHashView() {
  const read = () => {
    const h = window.location.hash.slice(1);
    return VIEWS.includes(h) ? h : 'dashboard';
  };
  const [view, setView] = useState(read);
  useEffect(() => {
    const onChange = () => setView(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return view;
}

export default function App() {
  const auth = useAuth();
  const user = auth.user;
  const live = useLive(auth.checked, user ? user.id : null);
  const view = useHashView();
  const [toast, setToast] = useState('');
  const [highlight, setHighlight] = useState(null);
  const toastTimer = useRef(null);
  const prevView = useRef(view);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }, []);

  // Move focus to the page heading when the person changes page.
  useEffect(() => {
    if (prevView.current === view) return;
    prevView.current = view;
    window.scrollTo(0, 0);
    const h1 = document.querySelector('main h1');
    if (h1) h1.focus({ preventScroll: true });
  }, [view]);

  function handleCreated(report) {
    setHighlight(report.code);
    setTimeout(() => setHighlight((c) => (c === report.code ? null : c)), 8000);
    showToast('Report submitted. Your tracking ID is ' + report.code + '.');
    window.location.hash = '#track';
  }

  async function handleAdvance(code) {
    try {
      const r = await api.advance(code);
      showToast('Status advanced. ' + code + ' is now ' + STATUS_LABEL[r.status].toLowerCase() + '.');
    } catch (err) {
      showToast(err.message);
    }
  }

  const openCount = live.reports.filter((r) => r.status !== 'collected').length;

  async function handleSignOut() {
    await auth.logout();
    window.location.hash = '#dashboard';
    showToast('You have been signed out.');
  }

  return (
    <>
      <Header view={view} openCount={openCount} online={live.ready} user={user} onSignOut={handleSignOut} />
      <main>
        {live.error && (
          <div className="wrap">
            <div className="banner" role="alert">
              <p>
                <strong>The server did not respond.</strong>
                Start the API on port 5000 and make sure MongoDB is running, then try again. ({live.error})
              </p>
              <button type="button" className="btn sec2" onClick={live.retry}>Try again</button>
            </div>
          </div>
        )}
        {!live.ready && !live.error && <div className="wrap"><p className="loading">Connecting to the server</p></div>}
        {live.ready && view === 'dashboard' && <Dashboard live={live} />}
        {live.ready && view === 'login' && (user
          ? <AuthPage auth={auth} notice={'You are signed in as ' + user.name + '.'} onDone={() => { window.location.hash = '#dashboard'; }} />
          : <AuthPage auth={auth} onDone={() => { window.location.hash = '#dashboard'; }} />)}
        {live.ready && view === 'report' && (user
          ? <ReportForm areas={live.bins.map((b) => b.area)} onCreated={handleCreated} />
          : <AuthPage auth={auth} notice="Sign in or create an account to report waste." />)}
        {live.ready && view === 'track' && (user
          ? <TrackList reports={live.reports} highlight={highlight} isAdmin={user.role === 'admin'} onAdvance={handleAdvance} />
          : <AuthPage auth={auth} notice="Sign in to see your requests." />)}
      </main>
      <footer>
        <div className="wrap">Data comes from the Express API and MongoDB. Bin levels and Truck 12 are simulated.</div>
      </footer>
      <Toast message={toast} />
    </>
  );
}
