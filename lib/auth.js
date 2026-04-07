const VALID_USER = 'everardo';
const VALID_PASS = 'everardo2026_';
const AUTH_KEY = 'monitor_obras_auth';

export function login(username, password) {
  if (username === VALID_USER && password === VALID_PASS) {
    const token = btoa(JSON.stringify({ user: username, ts: Date.now() }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, token);
    }
    return { success: true, user: username };
  }
  return { success: false, error: 'Usuário ou senha inválidos' };
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function getAuth() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(AUTH_KEY);
  if (!token) return null;
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return getAuth() !== null;
}
