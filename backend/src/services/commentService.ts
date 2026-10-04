import { query, queryOne, withTransaction } from '../db/pool';
import { addEvent } from './historyService';
import { HttpError } from '../utils/httpError';
import type { Comment, User } from '../types';

const MAX_COMMENT_LENGTH = 2000;

export async function listByTask(taskId: string): Promise<Comment[]> {
  return query<Comment>(
    `
    SELECT c.*, u.first_name AS author_name, u.role AS author_role
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.task_id = $1
    ORDER BY c.created_at ASC, c.id ASC;
    `,
    [taskId],
  );
}

/** Простая защита от спама: не чаще 1 комментария раз в 3 секунды на пользователя. */
async function assertNotSpamming(userId: string): Promise<void> {
  const row = await queryOne<{ last: string | null }>(
    `SELECT MAX(created_at) AS last FROM comments WHERE user_id = $1`,
    [userId],
  );
  if (row?.last) {
    const elapsed = Date.now() - new Date(row.last).getTime();
    if (elapsed < 3000) {
      throw new HttpError(429, 'Слишком часто. Подождите пару секунд перед следующим комментарием.');
    }
  }
}

export async function addComment(taskId: string, author: User, text: string): Promise<Comment> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new HttpError(400, 'Комментарий не может быть пустым');
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new HttpError(400, `Комментарий слишком длинный (макс. ${MAX_COMMENT_LENGTH} символов)`);
  }

  await assertNotSpamming(author.id);

  const id = await withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO comments (task_id, user_id, text) VALUES ($1, $2, $3) RETURNING id`,
      [taskId, author.id, trimmed],
    );
    const newId = String(res.rows[0].id);
    await addEvent(
      taskId,
      author.id,
      'COMMENT_ADDED',
      { preview: trimmed.slice(0, 80) },
      client,
    );
    return newId;
  });

  const created = await queryOne<Comment>(
    `
    SELECT c.*, u.first_name AS author_name, u.role AS author_role
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.id = $1
    `,
    [id],
  );
  return created as Comment;
}
