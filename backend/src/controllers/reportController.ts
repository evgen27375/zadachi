import type { Request, Response } from 'express';
import * as statsService from '../services/statsService';
import * as reportService from '../services/reportService';
import { reportQuerySchema } from '../utils/validation';

/** ADMIN: статистика для дашборда. */
export async function getStats(_req: Request, res: Response): Promise<void> {
  const stats = await statsService.getDashboardStats();
  res.json(stats);
}

/** ADMIN: отчёт за период (current_week | last_week | last_30_days). */
export async function getReport(req: Request, res: Response): Promise<void> {
  const { range } = reportQuerySchema.parse(req.query);
  const { from, to } = reportService.resolveRange(range);
  const report = await reportService.getReport(from, to);
  res.json({ range, ...report });
}
