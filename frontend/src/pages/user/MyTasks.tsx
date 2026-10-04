import { useEffect, useState } from 'react';
import { fetchMyTasks } from '../../api/endpoints';
import type { Task } from '../../types';
import { TaskCard } from '../../components/TaskCard';
import { EmptyState, ErrorBanner, Loader, Screen } from '../../components/common';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';

export default function MyTasks() {
  const { me } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyTasks()
      .then(setTasks)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <Screen><ErrorBanner message={error} /></Screen>;
  if (!tasks) return <Loader text="Загрузка задач…" />;

  const notStarted = tasks.filter((t) => t.status === 'NOT_STARTED');
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS');

  return (
    <Screen>
      <Header title="Мои задачи" subtitle={`Здравствуйте, ${me?.first_name ?? ''}!`} />

      {notStarted.length === 0 && inProgress.length === 0 && (
        <EmptyState emoji="🎉" title="Активных задач нет" hint="Новые задачи появятся здесь." />
      )}

      {inProgress.length > 0 && (
        <>
          <div className="section-title">В процессе</div>
          <div className="stack">
            {inProgress.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </>
      )}

      {notStarted.length > 0 && (
        <>
          <div className="section-title">Не начато</div>
          <div className="stack">
            {notStarted.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
