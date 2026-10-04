import type { Request, Response } from 'express';

/** Текущий пользователь (уже проверен и обновлён в authMiddleware). */
export function getMe(req: Request, res: Response): void {
  const u = req.authUser!;
  res.json({
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    username: u.username,
    role: u.role,
    first_seen_at: u.first_seen_at,
  });
}
