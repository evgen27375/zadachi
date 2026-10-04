import cron from 'node-cron';
import { config } from '../config/env';
import { getReport, resolveRange } from '../services/reportService';
import { sendWeeklyReport } from '../bot/notifications';

/** Сформировать и отправить еженедельный отчёт за прошедшую неделю. */
export async function runWeeklyReport(): Promise<void> {
  const { from, to } = resolveRange('last_week');
  const report = await getReport(from, to);
  await sendWeeklyReport(report);
  console.log(`[scheduler] еженедельный отчёт отправлен (${from.toISOString()} — ${to.toISOString()})`);
}

export function startWeeklyReportScheduler(): void {
  if (!cron.validate(config.weeklyReportCron)) {
    console.error(`[scheduler] некорректное CRON-выражение: "${config.weeklyReportCron}" — отчёт отключён`);
    return;
  }
  cron.schedule(
    config.weeklyReportCron,
    () => {
      runWeeklyReport().catch((e) =>
        console.error('[scheduler] ошибка формирования отчёта:', (e as Error).message),
      );
    },
    { timezone: config.appTimezone },
  );
  console.log(
    `[scheduler] еженедельный отчёт: "${config.weeklyReportCron}" (${config.appTimezone})`,
  );
}
