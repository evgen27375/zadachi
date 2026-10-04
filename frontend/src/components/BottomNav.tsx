import { useLocation, useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import type { Role } from '../types';
import { IconChart, IconCheck, IconHome, IconList, IconUsers } from './Icons';

interface NavDef {
  path: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
}

const ADMIN_NAV: NavDef[] = [
  { path: '/', label: 'Главная', Icon: IconHome },
  { path: '/tasks', label: 'Задачи', Icon: IconList },
  { path: '/people', label: 'Люди', Icon: IconUsers },
  { path: '/reports', label: 'Отчёты', Icon: IconChart },
];

const USER_NAV: NavDef[] = [
  { path: '/', label: 'Мои задачи', Icon: IconList },
  { path: '/done', label: 'Выполнено', Icon: IconCheck },
];

export function BottomNav({ role }: { role: Role }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = role === 'ADMIN' ? ADMIN_NAV : USER_NAV;

  return (
    <nav className="bottom-nav">
      {items.map(({ path, label, Icon }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(path)}
            type="button"
          >
            <Icon size={23} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
