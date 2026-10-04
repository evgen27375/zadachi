import { useEffect, useState } from 'react';
import { fetchUsers } from '../../api/endpoints';
import type { UserWithStats } from '../../types';
import { EmptyState, ErrorBanner, Loader, Screen } from '../../components/common';

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
      <div className="screen-header">
        <h1>Люди</h1>
        <p className="subtitle">Кто пользуется приложением</p>
      </div>

      {users.length === 0 ? (
        <EmptyState emoji="👥" title="Пользователей пока нет" hint="Они появятся после первого входа в Mini App или общения с ботом." />
      ) : (
        <div className="stack">
          {users.map((u) => (
            <div className="card" key={u.id}>
              <div className="row-between">
                <div>
                  <div style={{ fontWeight: 650 }}>
                    {u.first_name} {u.last_name ?? ''}
                    {u.role === 'ADMIN' && <span className="badge badge-in_progress" style={{ marginLeft: 8 }}>админ</span>}
                  </div>
                  <div className="faint small">
                    {u.username ? `@${u.username} · ` : ''}ID: {u.id}
                  </div>
                </div>
              </div>
              <div className="row" style={{ marginTop: 10, gap: 18 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{u.active_tasks}</div>
                  <div className="faint small">активных</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{u.done_tasks}</div>
                  <div className="faint small">выполнено</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}
