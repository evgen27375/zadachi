import { config } from '../config/env';
import { buildOpenAppButton, sendMessageToUser } from '../max/botClient';
import { formatDateTimeRu } from '../utils/dates';
import type { Report } from '../services/reportService';
import type { Task } from '../types';

/** Уведомления — best-effort: ошибка отправки не должна ронять основной запрос. */
async function safeSend(userId: string, text: string, startParam?: string): Promise<void> {
  try {
    await sendMessageToUser(userId, text, buildOpenAppButton(startParam));
  } catch (err) {
    console.error(`[notify] не доставлено user_id=${userId}:`, (err as Error).message);
  }
}

export async function notifyNewTask(task: Task): Promise<void> {
  const when = formatDateTimeRu(task.deadline, config.appTimezone);
  const text =
    `📋 Новая задача\n` +
    `${task.title}\n` +
    `Срок: ${when}\n` +
    `Откройте приложение, чтобы посмотреть подробности.`;
  await safeSend(task.assignee_id, text, `task_${task.id}`);
}

export async function notifyTaskDone(task: Task, assigneeName: string): Promise<void> {
  const when = task.completed_at
    ? formatDateTimeRu(task.completed_at, config.appTimezone)
    : formatDateTimeRu(new Date(), config.appTimezone);
  const text =
    `✅ Задача выполнена\n` +
    `${task.title}\n` +
    `Исполнитель: ${assigneeName}\n` +
    `Выполнено: ${when}`;
  await safeSend(config.adminMaxUserId, text, `task_${task.id}`);
}

export async function notifyNewComment(
  recipientId: string,
  task: Task,
  authorName: string,
  text: string,
): Promise<void> {
  const preview = text.length > 300 ? text.slice(0, 300) + '…' : text;
  const msg =
    `💬 Новый комментарий к задаче\n` +
    `${task.title}\n\n` +
    `${authorName}: ${preview}`;
  await safeSend(recipientId, msg, `task_${task.id}`);
}

export async function sendWeeklyReport(report: Report): Promise<void> {
  let text =
    `📊 Еженедельный отчёт\n` +
    `За неделю:\n` +
    `Выполнено: ${report.totals.done}\n` +
    `В процессе: ${report.totals.in_progress}\n` +
    `Не начато: ${report.totals.not_started}\n` +
    `Просрочено: ${report.totals.overdue}`;

  if (report.perUser.length > 0) {
    text += `\n`;
    for (const u of report.perUser) {
      text +=
        `\n${u.name}:\n` +
        `Выполнено — ${u.done}\n` +
        `В процессе — ${u.in_progress}\n` +
        `Не начато — ${u.not_started}\n` +
        `Просрочено — ${u.overdue}\n`;
    }
  }

  await safeSend(config.adminMaxUserId, text.trimEnd());
}
