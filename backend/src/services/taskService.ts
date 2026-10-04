import { pool, query, queryOne, withTransaction } from '../db/pool';
import { addEvent } from './historyService';
import { HttpError } from '../utils/httpError';
import type { Priority, Task, TaskStatus, TaskWithPeople, User } from '../types';

const BASE_SELECT = `
  SELECT
    t.*,
    u.first_name AS assignee_name,
    u.username   AS assignee_username,
    (t.deadline < now() AND t.status <> 'DONE') AS is_overdue
  FROM tasks t
  JOIN users u ON u.id = t.assignee_id
`;

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  assignee_id: string;
  deadline: string; // ISO
  priority: Priority;
}

export interface ListAllOptions {
  filter: 'all' | 'not_started' | 'in_progress' | 'done' | 'overdue';
  sort: 'created_at' | 'deadline' | 'assignee' | 'status';
  order: 'asc' | 'desc';
}

const STATUS_FILTER: Record<string, string> = {
  not_started: "t.status = 'NOT_STARTED'",
  in_progress: "t.status = 'IN_PROGRESS'",
  done: "t.status = 'DONE'",
  overdue: "t.deadline < now() AND t.status <> 'DONE'",
};

const SORT_COLUMN: Record<string, string> = {
  created_at: 't.created_at',
  deadline: 't.deadline',
  assignee: 'u.first_name',
  // осмысленный порядок статусов
  status: "CASE t.status WHEN 'NOT_STARTED' THEN 0 WHEN 'IN_PROGRESS' THEN 1 ELSE 2 END",
};

export async function createTask(input: CreateTaskInput, createdBy: string): Promise<TaskWithPeople> {
  const assignee = await queryOne<User>('SELECT id FROM users WHERE id = $1', [input.assignee_id]);
  if (!assignee) {
    throw new HttpError(400, 'Выбранный исполнитель не найден');
  }

  const task = await withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO tasks (title, description, assignee_id, created_by, priority, deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'NOT_STARTED')
       RETURNING id`,
      [input.title, input.description ?? null, input.assignee_id, createdBy, input.priority, input.deadline],
    );
    const id = String(res.rows[0].id);
    await addEvent(id, createdBy, 'CREATED', { title: input.title }, client);
    return id;
  });

  const full = await getByIdRaw(task);
  return full as TaskWithPeople;
}

export async function getByIdRaw(id: string): Promise<TaskWithPeople | null> {
  return queryOne<TaskWithPeople>(`${BASE_SELECT} WHERE t.id = $1`, [id]);
}

/**
 * Получить задачу с проверкой доступа.
 * Пользователь видит только свою задачу; админ — любую.
 * Если задача существует, но доступа нет — 403 (а не 404), но ID чужой задачи
 * всё равно не раскрывает содержимого.
 */
export async function getByIdForUser(id: string, user: User): Promise<TaskWithPeople> {
  const task = await getByIdRaw(id);
  if (!task) throw new HttpError(404, 'Задача не найдена');
  if (user.role !== 'ADMIN' && task.assignee_id !== user.id) {
    throw new HttpError(403, 'Нет доступа к этой задаче');
  }
  return task;
}

export async function listForAssignee(assigneeId: string): Promise<TaskWithPeople[]> {
  return query<TaskWithPeople>(
    `${BASE_SELECT} WHERE t.assignee_id = $1 ORDER BY t.created_at DESC`,
    [assigneeId],
  );
}

export async function listAll(opts: ListAllOptions): Promise<TaskWithPeople[]> {
  const where = STATUS_FILTER[opts.filter] ? `WHERE ${STATUS_FILTER[opts.filter]}` : '';
  const col = SORT_COLUMN[opts.sort] ?? 't.created_at';
  const dir = opts.order === 'asc' ? 'ASC' : 'DESC';
  return query<TaskWithPeople>(`${BASE_SELECT} ${where} ORDER BY ${col} ${dir}, t.id DESC`);
}

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  NOT_STARTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['DONE'],
  DONE: [],
};

/** Смена статуса задачи исполнителем. Возвращает обновлённую задачу. */
export async function updateStatus(
  id: string,
  user: User,
  newStatus: TaskStatus,
): Promise<TaskWithPeople> {
  const task = await getByIdRaw(id);
  if (!task) throw new HttpError(404, 'Задача не найдена');

  // Менять статус может только исполнитель задачи.
  if (task.assignee_id !== user.id) {
    throw new HttpError(403, 'Менять статус может только исполнитель задачи');
  }

  if (task.status === newStatus) {
    return task; // идемпотентно
  }

  if (!ALLOWED_TRANSITIONS[task.status].includes(newStatus)) {
    throw new HttpError(400, `Недопустимый переход статуса: ${task.status} → ${newStatus}`);
  }

  await withTransaction(async (client) => {
    if (newStatus === 'DONE') {
      await client.query(
        `UPDATE tasks SET status = 'DONE', completed_at = now() WHERE id = $1`,
        [id],
      );
      await addEvent(id, user.id, 'COMPLETED', null, client);
    } else if (newStatus === 'IN_PROGRESS') {
      await client.query(`UPDATE tasks SET status = 'IN_PROGRESS' WHERE id = $1`, [id]);
      await addEvent(id, user.id, 'STARTED', null, client);
    } else {
      await client.query(`UPDATE tasks SET status = $2 WHERE id = $1`, [id, newStatus]);
      await addEvent(id, user.id, 'STATUS_CHANGED', { to: newStatus }, client);
    }
  });

  return (await getByIdRaw(id)) as TaskWithPeople;
}

/** Проверка, что задача доступна пользователю (для комментариев). */
export async function assertAccess(task: Task, user: User): Promise<void> {
  if (user.role !== 'ADMIN' && task.assignee_id !== user.id) {
    throw new HttpError(403, 'Нет доступа к этой задаче');
  }
}

export async function getRawById(id: string): Promise<Task | null> {
  return queryOne<Task>('SELECT * FROM tasks WHERE id = $1', [id]);
}

export { pool };
