import type { NextFunction, Request, Response } from 'express';

/** Доступ только для администратора. Роль берётся из БД (сервер), не из запроса. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Не авторизован' });
    return;
  }
  if (req.authUser.role !== 'ADMIN') {
    res.status(403).json({ error: 'Доступ только для администратора' });
    return;
  }
  next();
}
