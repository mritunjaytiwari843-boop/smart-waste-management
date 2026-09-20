async function request(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options
  });
  const data = await res.json().catch(() => ({}));
  // A 401 on a normal call means the login expired. (/auth/* calls handle their own 401.)
  if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('wms:unauthorized'));
  if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
  return data;
}

export const api = {
  me: () => request('/auth/me'),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  state: () => request('/state'),
  reports: () => request('/reports'),
  createReport: (body) => request('/reports', { method: 'POST', body: JSON.stringify(body) }),
  advance: (code) => request('/reports/' + encodeURIComponent(code) + '/status', { method: 'PATCH' })
};
