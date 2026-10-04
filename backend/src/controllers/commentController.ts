import type { Request, Response } from 'express';
import { config } from '../config/env';
import * as taskService from '../services/taskService';
import * as commentService from '../services/commentService';
import { notifyNewComment } from '../bot/notifications';
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

  // Кому уведомление: если автор — админ, уведомляем исполнителя; иначе — админа.
  const recipientId = user.role === 'ADMIN' ? task.assignee_id : config.adminMaxUserId;
  if (recipientId && recipientId !== user.id) {
    await notifyNewComment(recipientId, task, user.first_name, text);
  }

  res.status(201).json(comment);
}
