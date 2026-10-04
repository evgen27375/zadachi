import { useEffect, useState } from 'react';
import { fetchMyTasks } from '../../api/endpoints';
import type { Task } from '../../types';
import { TaskCard } from '../../components/TaskCard';
import { EmptyState, ErrorBanner, Loader, Screen } from '../../components/common';

export default function DonePage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyTasks()
      .then(setTasks)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <Screen><ErrorBanner message={error} /></Screen>;
  if (!tasks) return <Loader text="Загрузка…" />;

  const done = tasks.filter((t) => t.status === 'DONE');

  return (
    <Screen>
      <div className="screen-header">
        <h1>Выполнено</h1>
        <p className="subtitle">Завершённые задачи</p>
      </div>

      {done.length === 0 ? (
        <EmptyState emoji="✅" title="Пока ничего не выполнено" />
      ) : (
        <div className="stack">
          {done.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </Screen>
  );
}
