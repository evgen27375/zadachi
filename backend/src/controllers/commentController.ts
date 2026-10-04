import type { Request, Response } from 'express';
import * as taskService from '../services/taskService';
import * as commentService from '../services/commentService';
import { notifyAdmins, notifyNewComment } from '../bot/notifications';
import { HttpError } from '../utils/httpError';
import { addCommentSchema, idParamSchema } from '../utils/validation';

export async function listComments(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const user = req.authUser!;
  const task = await taskService.getRawById(id);
  if (!task) throw new HttpError(404, 'Задача не найдена');
  await taskService.assertAccess(task, user);
  const comments = await commentService.listByTask(id);
  res.json(comments);
}

export async function addComment(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { text } = addCommentSchema.parse(req.body);
  const user = req.authUser!;

  const task = await taskService.getRawById(id);
  if (!task) throw new HttpError(404, 'Задача не найдена');
  await taskService.assertAccess(task, user);

  const comment = await commentService.addComment(id, user, text);

  // Кому уведомление: если автор — админ, уведомляем исполнителя;
  // если автор — обычный пользователь, уведомляем всех администраторов.
  if (user.role === 'ADMIN') {
    if (task.assignee_id && task.assignee_id !== user.id) {
      await notifyNewComment(task.assignee_id, task, user.first_name, text);
    }
  } else {
    const preview = text.length > 300 ? text.slice(0, 300) + '…' : text;
    const msg = `💬 Новый комментарий к задаче\n${task.title}\n\n${user.first_name}: ${preview}`;
    await notifyAdmins(msg, `task_${task.id}`, user.id);
  }

  res.status(201).json(comment);
}
