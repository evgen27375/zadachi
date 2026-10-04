export type Role = 'ADMIN' | 'USER';
export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type HistoryEventType =
  | 'CREATED'
  | 'STARTED'
  | 'COMPLETED'
  | 'STATUS_CHANGED'
  | 'COMMENT_ADDED';

export interface Me {
  id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  role: Role;
  first_seen_at: string;
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

export interface TaskDetail {
  task: Task;
  comments: Comment[];
  history?: HistoryEntry[];
}

export interface DashboardStats {
  active: number;
  not_started: number;
  in_progress: number;
  done: number;
  overdue: number;
}

export interface UserWithStats {
  id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  role: Role;
  first_seen_at: string;
  active_tasks: number;
  done_tasks: number;
}

export interface Assignee {
  id: string;
  first_name: string;
  username: string | null;
  role: Role;
}

export interface ReportCounts {
  done: number;
  in_progress: number;
  not_started: number;
  overdue: number;
}

export interface PerUserReport extends ReportCounts {
  user_id: string;
  name: string;
}

export interface Report {
  range: string;
  from: string;
  to: string;
  totals: ReportCounts;
  perUser: PerUserReport[];
}
