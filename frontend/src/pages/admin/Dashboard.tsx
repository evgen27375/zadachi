import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllTasks, fetchStats } from '../../api/endpoints';
import type { DashboardStats, Task } from '../../types';
import { TaskCard } from '../../components/TaskCard';
import { ErrorBanner, Loader, Screen } from '../../components/common';
import { Header } from '../../components/Header';
import {
  IconBell,
  IconChart,
  IconCheck,
  IconChevronRight,
  IconCircle,
  IconClock,
  IconList,
} from '../../components/Icons';

export default function Dashboard() {
  const navigate = useNavigate();
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

  const upcoming = [...tasks]
    .filter((t) => t.status !== 'DONE')
    .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))
    .slice(0, 3);

  return (
    <Screen>
      <Header
        title="Главная"
        subtitle="Сводка по задачам команды"
        action={
          <button className="icon-btn" aria-label="Уведомления">
            <IconBell size={21} />
          </button>
        }
      />

      <div className="stack">
        <div className="hero tappable" onClick={() => navigate('/tasks?filter=all')} role="button">
          <div className="value">{stats.active}</div>
          <div className="label">Активных задач</div>
          <div className="hero-chip"><IconChart size={22} /></div>
        </div>

        <div className="stat-grid">
          <div className="stat tappable" role="button" onClick={() => navigate('/tasks?filter=not_started')}>
            <div className="value">{stats.not_started}</div>
            <div className="label">Не начато</div>
            <span className="chip chip-grey"><IconList size={18} /></span>
          </div>
          <div className="stat tappable" role="button" onClick={() => navigate('/tasks?filter=in_progress')}>
            <div className="value">{stats.in_progress}</div>
            <div className="label">В процессе</div>
            <span className="chip chip-indigo"><IconCircle size={18} /></span>
          </div>
          <div className="stat tappable" role="button" onClick={() => navigate('/tasks?filter=done')}>
            <div className="value">{stats.done}</div>
            <div className="label">Выполнено</div>
            <span className="chip chip-green"><IconCheck size={18} /></span>
          </div>
          <div className="stat tappable" role="button" onClick={() => navigate('/tasks?filter=overdue')}>
            <div className="value" style={{ color: stats.overdue ? 'var(--red)' : undefined }}>
              {stats.overdue}
            </div>
            <div className="label">Просрочено</div>
            <span className="chip chip-red"><IconClock size={18} /></span>
          </div>
        </div>
      </div>

      <div className="section-title">
        Ближайшие задачи
        <span className="more" onClick={() => navigate('/tasks')}>
          <IconChevronRight size={18} />
        </span>
      </div>
      {upcoming.length === 0 ? (
        <p className="small muted" style={{ padding: '0 2px' }}>Активных задач нет.</p>
      ) : (
        <div className="stack">
          {upcoming.map((t) => (
            <TaskCard key={t.id} task={t} showAssignee />
          ))}
        </div>
      )}
    </Screen>
  );
}
