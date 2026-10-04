import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllTasks, type TaskListParams } from '../../api/endpoints';
import type { Task } from '../../types';
import { TaskCard } from '../../components/TaskCard';
import { EmptyState, ErrorBanner, Loader, Screen, Segmented } from '../../components/common';

type Filter = NonNullable<TaskListParams['filter']>;
type Sort = NonNullable<TaskListParams['sort']>;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'not_started', label: 'Не начато' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'done', label: 'Выполнено' },
  { value: 'overdue', label: 'Просрочено' },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: 'created_at', label: 'По дате' },
  { value: 'deadline', label: 'По дедлайну' },
  { value: 'assignee', label: 'По исполнителю' },
  { value: 'status', label: 'По статусу' },
];

export default function TasksPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('created_at');
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTasks(null);
    setError(null);
    fetchAllTasks({ filter, sort, order: sort === 'deadline' ? 'asc' : 'desc' })
      .then(setTasks)
      .catch((e: Error) => setError(e.message));
  }, [filter, sort]);

  return (
    <Screen>
      <div className="screen-header">
        <h1>Задачи</h1>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
        <Segmented options={SORTS} value={sort} onChange={setSort} />
      </div>

      <div style={{ height: 14 }} />

      {error && <ErrorBanner message={error} />}
      {!tasks && !error && <Loader text="Загрузка…" />}
      {tasks && tasks.length === 0 && <EmptyState title="Задач не найдено" />}
      {tasks && tasks.length > 0 && (
        <div className="stack">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} showAssignee />
          ))}
        </div>
      )}

      <button className="btn btn-primary btn-lg fab" onClick={() => navigate('/new')}>
        + Новая задача
      </button>
    </Screen>
  );
}
