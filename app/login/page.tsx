'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login, isAuthenticated } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 500));

    const authResult = login(username, password);
    if (authResult.success) {
      router.push('/dashboard');
    } else {
      setError(authResult.error || 'Erro ao efetuar login');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🏗️</div>
        <h1 className="login-title">Monitor de Obras</h1>
        <p className="login-subtitle">Acesse o sistema de gestão</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuário</label>
            <input
              id="login-username"
              className="input"
              type="text"
              value={username}
              onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setUsername(inputChangeEvent.target.value)}
              placeholder="Digite seu usuário"
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              id="login-password"
              className="input"
              type="password"
              value={password}
              onChange={(inputChangeEvent: ChangeEvent<HTMLInputElement>) => setPassword(inputChangeEvent.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            id="login-submit"
            type="submit"
            className="btn btn-lg btn-block mt-4"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="spinner" /> Entrando...
              </span>
            ) : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
