import { useEffect, useState } from 'react';
import { fetchUsers } from '../../api/endpoints';
import type { UserWithStats } from '../../types';
import { EmptyState, ErrorBanner, Loader, Screen } from '../../components/common';
import { Header } from '../../components/Header';
import { IconUserPlus } from '../../components/Icons';

function initial(name: string): string {
  return (name || '?').trim().charAt(0).toUpperCase();
}

export default function PeoplePage() {
  const [users, setUsers] = useState<UserWithStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <Screen><ErrorBanner message={error} /></Screen>;
  if (!users) return <Loader text="Загрузка пользователей…" />;

  return (
    <Screen>
      <Header
        title="Люди"
        subtitle="Кто пользуется приложением"
        action={
          <button className="icon-btn" aria-label="Пользователи">
            <IconUserPlus size={21} />
          </button>
        }
      />

      {users.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="Пользователей пока нет"
          hint="Они появятся после первого входа в Mini App или общения с ботом."
        />
      ) : (
        <div className="stack">
          {users.map((u) => (
            <div className="card" key={u.id}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div className="avatar">{initial(u.first_name)}</div>
                <div className="grow">
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                      {u.first_name} {u.last_name ?? ''}
                    </span>
                    {u.role === 'ADMIN' && <span className="badge badge-in_progress">админ</span>}
                  </div>
                  <div className="faint small" style={{ marginTop: 2 }}>
                    ID: {u.id}
                  </div>
                  <div className="metrics">
                    <div className="m">
                      <div className="n">{u.active_tasks}</div>
                      <div className="t">активных</div>
                    </div>
                    <div className="m">
                      <div className="n">{u.done_tasks}</div>
                      <div className="t">выполнено</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}
