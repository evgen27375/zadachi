import type { Request, Response } from 'express';
import * as userService from '../services/userService';

/** ADMIN: список пользователей со счётчиками задач. */
export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await userService.listWithStats();
  res.json(users);
}

/** ADMIN: список исполнителей для формы создания задачи. */
export async function listAssignees(_req: Request, res: Response): Promise<void> {
  const users = await userService.listAssignees();
  res.json(
    users.map((u) => ({ id: u.id, first_name: u.first_name, username: u.username, role: u.role })),
  );
}
