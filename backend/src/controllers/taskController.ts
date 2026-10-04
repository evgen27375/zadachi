import type { Request, Response } from 'express';
import * as taskService from '../services/taskService';
import * as commentService from '../services/commentService';
import * as historyService from '../services/historyService';
import { notifyNewTask, notifyTaskDone } from '../bot/notifications';
import {
  createTaskSchema,
  idParamSchema,
  listTasksQuerySchema,
  updateStatusSchema,
} from '../utils/validation';

/** USER: свои задачи. (Админ тоже получит свои, но у него есть /admin/tasks.) */
export async function listMyTasks(req: Request, res: Response): Promise<void> {
  const tasks = await taskService.listForAssignee(req.authUser!.id);
  res.json(tasks);
}

/** ADMIN: все задачи с фильтрами и сортировкой. */
export async function listAllTasks(req: Request, res: Response): Promise<void> {
  const q = listTasksQuerySchema.parse(req.query);
  const tasks = await taskService.listAll(q);
  res.json(tasks);
}

/** Детали задачи: доступ проверяется в сервисе. Комментарии — всем сторонам,
 * история — только администратору. */
export async function getTask(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const user = req.authUser!;
  const task = await taskService.getByIdForUser(id, user);
  const comments = await commentService.listByTask(id);
  const history = user.role === 'ADMIN' ? await historyService.listByTask(id) : undefined;
  res.json({ task, comments, history });
}

/** ADMIN: создание задачи + уведомление исполнителю. */
export async function createTask(req: Request, res: Response): Promise<void> {
  const dto = createTaskSchema.parse(req.body);
  const task = await taskService.createTask(dto, req.authUser!.id);
  // уведомление — после ответа не ждём, но здесь await для надёжности логирования
  await notifyNewTask(task);
  res.status(201).json(task);
}

/** USER (исполнитель): смена статуса. При завершении — уведомление администратору. */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { status } = updateStatusSchema.parse(req.body);
  const task = await taskService.updateStatus(id, req.authUser!, status);
  if (task.status === 'DONE') {
    await notifyTaskDone(task, task.assignee_name);
  }
  res.json(task);
}
