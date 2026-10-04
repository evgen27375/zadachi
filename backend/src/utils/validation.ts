import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название').max(200, 'Слишком длинное название'),
  description: z
    .string()
    .trim()
    .max(4000, 'Слишком длинное описание')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v ?? null)),
  assignee_id: z.string().regex(/^\d+$/, 'Некорректный исполнитель'),
  deadline: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Некорректная дата дедлайна')
    .transform((v) => new Date(v).toISOString()),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE']),
});

export const addCommentSchema = z.object({
  text: z.string().trim().min(1, 'Комментарий пуст').max(2000, 'Слишком длинный комментарий'),
});

export const listTasksQuerySchema = z.object({
  filter: z.enum(['all', 'not_started', 'in_progress', 'done', 'overdue']).default('all'),
  sort: z.enum(['created_at', 'deadline', 'assignee', 'status']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const reportQuerySchema = z.object({
  range: z.enum(['current_week', 'last_week', 'last_30_days']).default('current_week'),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Некорректный ID'),
});
