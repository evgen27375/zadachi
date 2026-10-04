import { config } from '../config/env';
import { query, queryOne } from '../db/pool';
import type { MaxAuthUser, Role, User } from '../types';

/** Роль определяется ТОЛЬКО на сервере по списку администраторов. */
export function resolveRole(maxUserId: string): Role {
  return config.adminMaxUserIds.includes(maxUserId) ? 'ADMIN' : 'USER';
}

/**
 * Создать/обновить пользователя по проверенным данным MAX.
 * Роль пересчитывается при каждом входе — фронтенд на неё не влияет.
 */
export async function upsertFromMax(u: MaxAuthUser): Promise<User> {
  const role = resolveRole(u.id);
  const row = await queryOne<User>(
    `
    INSERT INTO users (id, first_name, last_name, username, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name  = EXCLUDED.last_name,
      username   = EXCLUDED.username,
      role       = EXCLUDED.role
    RETURNING *;
    `,
    [u.id, u.first_name, u.last_name, u.username, role],
  );
  return row as User;
}

export async function getById(id: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
}

export interface UserWithStats extends User {
  active_tasks: number;
  done_tasks: number;
}

/** Список пользователей, которые хоть раз заходили/взаимодействовали, со счётчиками. */
export async function listWithStats(): Promise<UserWithStats[]> {
  return query<UserWithStats>(`
    SELECT
      u.*,
      COALESCE(SUM(CASE WHEN t.status IN ('NOT_STARTED','IN_PROGRESS') THEN 1 ELSE 0 END), 0)::int AS active_tasks,
      COALESCE(SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END), 0)::int AS done_tasks
    FROM users u
    LEFT JOIN tasks t ON t.assignee_id = u.id
    GROUP BY u.id
    ORDER BY u.first_name ASC, u.id ASC;
  `);
}

/** Пользователи, доступные как исполнители (все известные пользователи). */
export async function listAssignees(): Promise<User[]> {
  return query<User>('SELECT * FROM users ORDER BY first_name ASC, id ASC');
}
