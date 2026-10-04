import { query } from '../db/pool';
import { addDays, startOfISOWeek } from '../utils/dates';

export interface ReportCounts {
  done: number; // завершено за период (по completed_at)
  in_progress: number; // в процессе на текущий момент
  not_started: number; // не начато на текущий момент
  overdue: number; // просрочено на текущий момент
}

export interface PerUserReport extends ReportCounts {
  user_id: string;
  name: string;
}

export interface Report {
  from: string;
  to: string;
  totals: ReportCounts;
  perUser: PerUserReport[];
}

export type RangeKey = 'current_week' | 'last_week' | 'last_30_days';

export function resolveRange(range: RangeKey, now = new Date()): { from: Date; to: Date } {
  switch (range) {
    case 'current_week': {
      return { from: startOfISOWeek(now), to: now };
    }
    case 'last_week': {
      const startThis = startOfISOWeek(now);
      return { from: addDays(startThis, -7), to: startThis };
    }
    case 'last_30_days':
    default:
      return { from: addDays(now, -30), to: now };
  }
}

/**
 * done — задачи, завершённые (completed_at) в интервале [from, to).
 * in_progress / not_started / overdue — срез на текущий момент (открытые состояния).
 */
export async function getReport(from: Date, to: Date): Promise<Report> {
  const totalsRows = await query<Record<string, string>>(
    `
    SELECT
      COUNT(*) FILTER (WHERE completed_at >= $1 AND completed_at < $2)   AS done,
      COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')                      AS in_progress,
      COUNT(*) FILTER (WHERE status = 'NOT_STARTED')                      AS not_started,
      COUNT(*) FILTER (WHERE status <> 'DONE' AND deadline < now())       AS overdue
    FROM tasks;
    `,
    [from.toISOString(), to.toISOString()],
  );
  const t = totalsRows[0] ?? {};

  const perUser = await query<Record<string, string>>(
    `
    SELECT
      u.id   AS user_id,
      u.first_name AS name,
      COUNT(t.*) FILTER (WHERE t.completed_at >= $1 AND t.completed_at < $2) AS done,
      COUNT(t.*) FILTER (WHERE t.status = 'IN_PROGRESS')                      AS in_progress,
      COUNT(t.*) FILTER (WHERE t.status = 'NOT_STARTED')                      AS not_started,
      COUNT(t.*) FILTER (WHERE t.status <> 'DONE' AND t.deadline < now())     AS overdue
    FROM users u
    LEFT JOIN tasks t ON t.assignee_id = u.id
    GROUP BY u.id, u.first_name
    HAVING COUNT(t.*) > 0
    ORDER BY u.first_name ASC;
    `,
    [from.toISOString(), to.toISOString()],
  );

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totals: {
      done: Number(t.done ?? 0),
      in_progress: Number(t.in_progress ?? 0),
      not_started: Number(t.not_started ?? 0),
      overdue: Number(t.overdue ?? 0),
    },
    perUser: perUser.map((r) => ({
      user_id: String(r.user_id),
      name: r.name ?? '',
      done: Number(r.done ?? 0),
      in_progress: Number(r.in_progress ?? 0),
      not_started: Number(r.not_started ?? 0),
      overdue: Number(r.overdue ?? 0),
    })),
  };
}
