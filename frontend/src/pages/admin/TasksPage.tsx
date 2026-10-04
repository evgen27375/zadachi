import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAllTasks, type TaskListParams } from '../../api/endpoints';
import type { Task } from '../../types';
import { TaskCard } from '../../components/TaskCard';
import { EmptyState, ErrorBanner, Loader, Screen, Segmented } from '../../components/common';
import { Header } from '../../components/Header';
import { IconPlus, IconSearch } from '../../components/Icons';

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

const FILTER_VALUES: Filter[] = ['all', 'not_started', 'in_progress', 'done', 'overdue'];

export default function TasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawFilter = searchParams.get('filter') as Filter | null;
  const filter: Filter = rawFilter && FILTER_VALUES.includes(rawFilter) ? rawFilter : 'all';
  const setFilter = (f: Filter) => {
    setSearchParams(
      (prev) => {
        prev.set('filter', f);
        return prev;
      },
      { replace: true },
    );
  };

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
      <Header
        title="Задачи"
        subtitle="Все задачи команды"
        action={
          <button className="icon-btn" aria-label="Поиск">
            <IconSearch size={21} />
          </button>
        }
      />

      <div className="stack" style={{ gap: 10 }}>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
        <Segmented options={SORTS} value={sort} onChange={setSort} />
      </div>

      <div style={{ height: 16 }} />

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

      <button className="fab" onClick={() => navigate('/new')} aria-label="Новая задача">
        <IconPlus size={26} />
      </button>
    </Screen>
  );
}
