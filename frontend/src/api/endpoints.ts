import { api } from './client';
import type {
  Assignee,
  Comment,
  DashboardStats,
  Me,
  Priority,
  Report,
  Task,
  TaskDetail,
  TaskStatus,
  UserWithStats,
} from '../types';

// --- Auth ---
export const fetchMe = () => api.get<Me>('/auth/me');

// --- Пользователь: свои задачи ---
export const fetchMyTasks = () => api.get<Task[]>('/tasks');
export const fetchTask = (id: string) => api.get<TaskDetail>(`/tasks/${id}`);
export const updateTaskStatus = (id: string, status: TaskStatus) =>
  api.patch<Task>(`/tasks/${id}/status`, { status });

// --- Комментарии ---
export const fetchComments = (id: string) => api.get<Comment[]>(`/tasks/${id}/comments`);
export const addComment = (id: string, text: string) =>
  api.post<Comment>(`/tasks/${id}/comments`, { text });

// --- Админ ---
export interface TaskListParams {
  filter?: 'all' | 'not_started' | 'in_progress' | 'done' | 'overdue';
  sort?: 'created_at' | 'deadline' | 'assignee' | 'status';
  order?: 'asc' | 'desc';
}

export const fetchAllTasks = (p: TaskListParams = {}) => {
  const q = new URLSearchParams();
  if (p.filter) q.set('filter', p.filter);
  if (p.sort) q.set('sort', p.sort);
  if (p.order) q.set('order', p.order);
  const qs = q.toString();
  return api.get<Task[]>(`/admin/tasks${qs ? `?${qs}` : ''}`);
};

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  assignee_id: string;
  deadline: string;
  priority: Priority;
}

export const createTask = (payload: CreateTaskPayload) =>
  api.post<Task>('/admin/tasks', payload);

export const fetchStats = () => api.get<DashboardStats>('/admin/stats');
export const fetchUsers = () => api.get<UserWithStats[]>('/admin/users');
export const fetchAssignees = () => api.get<Assignee[]>('/admin/assignees');
export const fetchReport = (range: 'current_week' | 'last_week' | 'last_30_days') =>
  api.get<Report>(`/admin/reports?range=${range}`);
