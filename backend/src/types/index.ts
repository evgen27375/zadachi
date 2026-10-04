export type Role = 'ADMIN' | 'USER';

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

export type Priority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export type HistoryEventType =
  | 'CREATED'
  | 'STARTED'
  | 'COMPLETED'
  | 'STATUS_CHANGED'
  | 'COMMENT_ADDED';

export interface User {
  id: string; // MAX user ID (bigint как строка)
  first_name: string;
  last_name: string | null;
  username: string | null;
  role: Role;
  first_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string;
  created_by: string;
  status: TaskStatus;
  priority: Priority;
  deadline: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface TaskWithPeople extends Task {
  assignee_name: string;
  assignee_username: string | null;
  is_overdue: boolean;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  text: string;
  created_at: string;
  author_name: string;
  author_role: Role;
}

export interface HistoryEntry {
  id: string;
  task_id: string;
  user_id: string | null;
  event_type: HistoryEventType;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor_name: string | null;
}

/** Данные пользователя, полученные из проверенного MAX initData. */
export interface MaxAuthUser {
  id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
}

// Расширяем Express.Request полем user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: User;
    }
  }
}
