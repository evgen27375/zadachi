import { queryOne } from '../db/pool';

export interface DashboardStats {
  active: number; // всего активных (не DONE)
  not_started: number;
  in_progress: number;
  done: number;
  overdue: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const row = await queryOne<Record<string, string>>(`
    SELECT
      COUNT(*) FILTER (WHERE status <> 'DONE')                                    AS active,
      COUNT(*) FILTER (WHERE status = 'NOT_STARTED')                              AS not_started,
      COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')                              AS in_progress,
      COUNT(*) FILTER (WHERE status = 'DONE')                                     AS done,
      COUNT(*) FILTER (WHERE status <> 'DONE' AND deadline < now())               AS overdue
    FROM tasks;
  `);
  return {
    active: Number(row?.active ?? 0),
    not_started: Number(row?.not_started ?? 0),
    in_progress: Number(row?.in_progress ?? 0),
    done: Number(row?.done ?? 0),
    overdue: Number(row?.overdue ?? 0),
  };
}
