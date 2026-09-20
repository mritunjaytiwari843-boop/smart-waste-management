import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

// Keeps track of who is signed in. The login itself lives in an httpOnly cookie.
export function useAuth() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let dead = false;
    api
      .me()
      .then((u) => !dead && setUser(u))
      .catch(() => !dead && setUser(null))
      .finally(() => !dead && setChecked(true));
    const onExpired = () => setUser(null);
    window.addEventListener('wms:unauthorized', onExpired);
    return () => {
      dead = true;
      window.removeEventListener('wms:unauthorized', onExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await api.login({ email, password });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const u = await api.register({ name, email, password });
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (_err) {
      /* the cookie is cleared on the server; the page state resets either way */
    }
    setUser(null);
  }, []);

  return { user, checked, login, register, logout };
}
