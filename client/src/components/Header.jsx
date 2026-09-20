const LINKS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'report', label: 'Report waste' },
  { id: 'track', label: 'Track requests', short: 'Track' }
];

export default function Header({ view, openCount, online, user, onSignOut }) {
  return (
    <header className="top">
      <div className="wrap">
        <a className="brand" href="#dashboard">
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="#F26B21" />
            <path d="M10 12h12l-1.2 12.2a1.5 1.5 0 0 1-1.5 1.3h-6.6a1.5 1.5 0 0 1-1.5-1.3z" fill="#1A0F08" />
            <rect x="8.5" y="9" width="15" height="2.4" rx="1" fill="#1A0F08" />
            <rect x="13" y="6.5" width="6" height="2.5" rx="1" fill="#1A0F08" />
          </svg>
          <span>Smart Waste Management</span>
        </a>
        <nav aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.id} href={'#' + l.id} aria-current={view === l.id ? 'page' : undefined}>
              <span>
                {l.short || l.label}
                {l.short && <span className="xs-hide">&nbsp;requests</span>}
              </span>
              {l.id === 'track' && user && openCount > 0 && <span className="count">{openCount}</span>}
            </a>
          ))}
        </nav>
        <div className="right">
          <span className="live">
            <i style={online ? undefined : { background: 'var(--bad)', animation: 'none' }} />
            {online ? 'Live' : 'Offline'}
          </span>
          {user ? (
            <span className="who">
              <span className="nm">{user.name}</span>
              {user.role === 'admin' && <span className="role">Admin</span>}
              <button type="button" className="linkbtn" onClick={onSignOut}>Sign out</button>
            </span>
          ) : (
            <a className="signin" href="#login" aria-current={view === 'login' ? 'page' : undefined}>Sign in</a>
          )}
        </div>
      </div>
    </header>
  );
}
