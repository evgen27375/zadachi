// Демо-данные ТОЛЬКО для локальной визуальной проверки дизайна.
// Активируется исключительно при VITE_DEMO=1 (в продакшене переменной нет).
import type {
  Assignee,
  Comment,
  DashboardStats,
  Me,
  Report,
  Task,
  TaskDetail,
  UserWithStats,
} from '../types';

export const isDemo = import.meta.env.VITE_DEMO === '1';

const now = Date.now();
const iso = (deltaH: number) => new Date(now + deltaH * 3600_000).toISOString();

const me: Me = {
  id: '4417586',
  first_name: 'Женя',
  last_name: 'Железнов',
  username: 'zhelez',
  role: 'ADMIN',
  first_seen_at: iso(-200),
};

const tasks: Task[] = [
  {
    id: '1', title: 'Подготовить отчёт', description: 'Квартальный отчёт для руководства',
    assignee_id: '13332197', created_by: '4417586', status: 'DONE', priority: 'IMPORTANT',
    deadline: iso(-20), created_at: iso(-50), updated_at: iso(-5), completed_at: iso(-6),
    assignee_name: 'Владимир', assignee_username: 'vladimir', is_overdue: false,
  },
  {
    id: '2', title: 'Сверка с контрагентами', description: null,
    assignee_id: '28541610', created_by: '4417586', status: 'IN_PROGRESS', priority: 'URGENT',
    deadline: iso(30), created_at: iso(-10), updated_at: iso(-2), completed_at: null,
    assignee_name: 'Юлия', assignee_username: null, is_overdue: false,
  },
  {
    id: '3', title: 'Обновить реквизиты', description: null,
    assignee_id: '28541610', created_by: '4417586', status: 'NOT_STARTED', priority: 'NORMAL',
    deadline: iso(72), created_at: iso(-3), updated_at: iso(-3), completed_at: null,
    assignee_name: 'Юлия', assignee_username: null, is_overdue: false,
  },
  {
    id: '4', title: 'Закрыть месяц в 1С', description: null,
    assignee_id: '13332197', created_by: '4417586', status: 'NOT_STARTED', priority: 'IMPORTANT',
    deadline: iso(-5), created_at: iso(-15), updated_at: iso(-15), completed_at: null,
    assignee_name: 'Владимир', assignee_username: 'vladimir', is_overdue: true,
  },
];

const stats: DashboardStats = { active: 3, not_started: 2, in_progress: 1, done: 1, overdue: 1 };

const users: UserWithStats[] = [
  { id: '13332197', first_name: 'Владимир', last_name: 'Железнов', username: 'vladimir', role: 'USER', first_seen_at: iso(-100), active_tasks: 1, done_tasks: 1 },
  { id: '4417586', first_name: 'Женя', last_name: 'Железнов', username: 'zhelez', role: 'ADMIN', first_seen_at: iso(-200), active_tasks: 0, done_tasks: 0 },
  { id: '28541610', first_name: 'Юлия', last_name: 'Железнова', username: null, role: 'ADMIN', first_seen_at: iso(-80), active_tasks: 2, done_tasks: 0 },
];

const assignees: Assignee[] = users.map((u) => ({ id: u.id, first_name: u.first_name, username: u.username, role: u.role }));

const report: Report = {
  range: 'current_week', from: iso(-168), to: iso(0),
  totals: { done: 1, in_progress: 1, not_started: 2, overdue: 1 },
  perUser: [
    { user_id: '13332197', name: 'Владимир', done: 1, in_progress: 0, not_started: 1, overdue: 1 },
    { user_id: '28541610', name: 'Юлия', done: 0, in_progress: 1, not_started: 1, overdue: 0 },
  ],
};

const comments: Comment[] = [
  { id: '1', task_id: '2', user_id: '28541610', text: 'Начала сверку, часть контрагентов ответила.', created_at: iso(-3), author_name: 'Юлия', author_role: 'USER' },
  { id: '2', task_id: '2', user_id: '4417586', text: 'Хорошо, держи в курсе.', created_at: iso(-2), author_name: 'Женя', author_role: 'ADMIN' },
];

function taskDetail(id: string): TaskDetail {
  const task = tasks.find((t) => t.id === id) ?? tasks[0];
  return {
    task,
    comments: task.id === '2' ? comments : [],
    history: [
      { id: '1', task_id: task.id, user_id: '4417586', event_type: 'CREATED', metadata: null, created_at: task.created_at, actor_name: 'Женя' },
      { id: '2', task_id: task.id, user_id: task.assignee_id, event_type: 'STARTED', metadata: null, created_at: iso(-4), actor_name: task.assignee_name },
    ],
  };
}

export function demoResponse<T>(_method: string, path: string): Promise<T> {
  const p = path.split('?')[0];
  let data: unknown = null;
  if (p === '/auth/me') data = me;
  else if (p === '/admin/stats') data = stats;
  else if (p === '/admin/tasks') data = tasks;
  else if (p === '/admin/users') data = users;
  else if (p === '/admin/assignees') data = assignees;
  else if (p === '/admin/reports') data = report;
  else if (p === '/tasks') data = tasks.filter((t) => t.assignee_id === me.id);
  else if (/^\/tasks\/\d+\/comments$/.test(p)) data = comments;
  else if (/^\/tasks\/\d+$/.test(p)) data = taskDetail(p.split('/')[2]);
  else data = {};
  return new Promise((resolve) => setTimeout(() => resolve(data as T), 150));
}

export const demoMe = me;
