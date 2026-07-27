const VALID_USER = 'everardo';
const VALID_PASS = 'everardo2026_';
const AUTH_KEY = 'monitor_obras_auth';

export interface AuthState {
  user: string;
  ts: number;
}

export function login(username: string, password: string) {
  if (username === VALID_USER && password === VALID_PASS) {
    const token = btoa(JSON.stringify({ user: username, ts: Date.now() }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, token);
    }
    return { success: true, user: username };
  }
  return { success: false, error: 'Usuário ou senha inválidos' };
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function getAuth(): AuthState | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(AUTH_KEY);
  if (!token) return null;
  try {
    return JSON.parse(atob(token)) as AuthState;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getAuth() !== null;
}
