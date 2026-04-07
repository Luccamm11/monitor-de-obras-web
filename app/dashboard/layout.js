'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getAuth, logout } from '@/lib/auth';

const NAV_ITEMS = [
  { name: 'Principal', path: '/dashboard', icon: '🏠' },
  { name: 'Obras', path: '/dashboard/obras', icon: '🏗️' },
  { name: 'Relatórios', path: '/dashboard/relatorios', icon: '📊' },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const auth = getAuth();

  if (!ready) {
    return (
      <div className="login-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏗️</div>
          <span className="sidebar-logo-text">Monitor Obras</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`sidebar-btn ${pathname === item.path ? 'active' : ''}`}
              onClick={() => router.push(item.path)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {auth?.user?.charAt(0) || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{auth?.user || 'Usuário'}</div>
              <div className="sidebar-user-role">Administrador</div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout} title="Sair">
              🚪
            </button>
          </div>
        </div>
      </aside>

      <main className="content">
        {children}
      </main>
    </div>
  );
}
