import type { PoolClient } from 'pg';
import { pool, query } from '../db/pool';
import type { HistoryEntry, HistoryEventType } from '../types';

type Executor = Pick<PoolClient, 'query'> | typeof pool;

/** Записать событие истории (можно в рамках транзакции, передав client). */
export async function addEvent(
  taskId: string,
  userId: string | null,
  eventType: HistoryEventType,
  metadata: Record<string, unknown> | null = null,
  executor: Executor = pool,
): Promise<void> {
  await executor.query(
    `INSERT INTO task_history (task_id, user_id, event_type, metadata)
     VALUES ($1, $2, $3, $4)`,
    [taskId, userId, eventType, metadata ? JSON.stringify(metadata) : null],
  );
}

/** История задачи в хронологическом порядке. */
export async function listByTask(taskId: string): Promise<HistoryEntry[]> {
  return query<HistoryEntry>(
    `
    SELECT h.*, u.first_name AS actor_name
    FROM task_history h
    LEFT JOIN users u ON u.id = h.user_id
    WHERE h.task_id = $1
    ORDER BY h.created_at ASC, h.id ASC;
    `,
    [taskId],
  );
}
