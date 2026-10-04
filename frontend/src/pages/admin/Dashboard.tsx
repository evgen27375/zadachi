import { useEffect, useState } from 'react';
import { fetchAllTasks, fetchStats } from '../../api/endpoints';
import type { DashboardStats, Task } from '../../types';
import { TaskCard } from '../../components/TaskCard';
import { ErrorBanner, Loader, Screen } from '../../components/common';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchStats(), fetchAllTasks({ filter: 'all', sort: 'created_at', order: 'desc' })])
      .then(([s, t]) => {
        setStats(s);
        setTasks(t);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <Screen><ErrorBanner message={error} /></Screen>;
  if (!stats || !tasks) return <Loader text="Загрузка статистики…" />;

  const groups: { key: string; title: string; items: Task[] }[] = [
    { key: 'ns', title: 'Не начато', items: tasks.filter((t) => t.status === 'NOT_STARTED') },
    { key: 'ip', title: 'В процессе', items: tasks.filter((t) => t.status === 'IN_PROGRESS') },
    { key: 'dn', title: 'Выполнено', items: tasks.filter((t) => t.status === 'DONE') },
  ];

  return (
    <Screen>
      <div className="screen-header">
        <h1>Главная</h1>
        <p className="subtitle">Сводка по задачам команды</p>
      </div>

      <div className="stat-grid">
        <div className="card stat accent full">
          <div className="value">{stats.active}</div>
          <div className="label">Активных задач</div>
        </div>
        <div className="card stat">
          <div className="value">{stats.not_started}</div>
          <div className="label">Не начато</div>
        </div>
        <div className="card stat">
          <div className="value">{stats.in_progress}</div>
          <div className="label">В процессе</div>
        </div>
        <div className="card stat">
          <div className="value">{stats.done}</div>
          <div className="label">Выполнено</div>
        </div>
        <div className="card stat danger">
          <div className="value">{stats.overdue}</div>
          <div className="label">Просрочено</div>
        </div>
      </div>

      {groups.map((g) =>
        g.items.length > 0 ? (
          <div key={g.key}>
            <div className="section-title">
              {g.title} · {g.items.length}
            </div>
            <div className="stack">
              {g.items.slice(0, 5).map((t) => (
                <TaskCard key={t.id} task={t} showAssignee />
              ))}
            </div>
          </div>
        ) : null,
      )}
    </Screen>
  );
}
