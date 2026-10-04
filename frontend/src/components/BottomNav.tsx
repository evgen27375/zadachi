import { useLocation, useNavigate } from 'react-router-dom';
import type { Role } from '../types';

interface NavDef {
  path: string;
  label: string;
  icon: string;
}

const ADMIN_NAV: NavDef[] = [
  { path: '/', label: 'Главная', icon: '🏠' },
  { path: '/tasks', label: 'Задачи', icon: '🗂️' },
  { path: '/people', label: 'Люди', icon: '👥' },
  { path: '/reports', label: 'Отчёты', icon: '📊' },
];

const USER_NAV: NavDef[] = [
  { path: '/', label: 'Мои задачи', icon: '🗂️' },
  { path: '/done', label: 'Выполнено', icon: '✅' },
];

export function BottomNav({ role }: { role: Role }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = role === 'ADMIN' ? ADMIN_NAV : USER_NAV;

  return (
    <nav className="bottom-nav">
      {items.map((it) => {
        const active = pathname === it.path;
        return (
          <button
            key={it.path}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(it.path)}
            type="button"
          >
            <span className="icon">{it.icon}</span>
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
