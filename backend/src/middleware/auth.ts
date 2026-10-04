import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/env';
import { validateInitData } from '../max/validateInitData';
import { upsertFromMax } from '../services/userService';

/**
 * Проверка подлинности запроса через MAX initData.
 * Frontend присылает строку initData в заголовке X-Max-Init-Data.
 * Backend валидирует подпись (HMAC) и НИКОГДА не доверяет user.id напрямую.
 * При каждом успешном запросе пользователь создаётся/обновляется в БД —
 * так формируется список «кто хоть раз заходил».
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const initData =
      (req.header('x-max-init-data') || req.header('X-Max-Init-Data') || '').trim();

    if (!initData) {
      res.status(401).json({ error: 'Требуется авторизация MAX (initData отсутствует)' });
      return;
    }

    const result = validateInitData(initData, config.botToken, config.initDataMaxAgeSeconds);
    if (!result.ok) {
      res.status(401).json({ error: result.error });
      return;
    }

    const user = await upsertFromMax(result.user);
    req.authUser = user;
    next();
  } catch (err) {
    next(err);
  }
}
