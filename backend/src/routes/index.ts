import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { asyncHandler } from '../utils/asyncHandler';

import { getMe } from '../controllers/authController';
import {
  createTask,
  getTask,
  listAllTasks,
  listMyTasks,
  updateStatus,
} from '../controllers/taskController';
import { addComment, listComments } from '../controllers/commentController';
import { listAssignees, listUsers } from '../controllers/userController';
import { getReport, getStats } from '../controllers/reportController';

export const apiRouter = Router();

// Health-check — без авторизации
apiRouter.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Всё ниже требует валидного MAX initData
apiRouter.use(authMiddleware);

apiRouter.get('/auth/me', getMe);

// Задачи текущего пользователя
apiRouter.get('/tasks', asyncHandler(listMyTasks));
apiRouter.get('/tasks/:id', asyncHandler(getTask));
apiRouter.patch('/tasks/:id/status', asyncHandler(updateStatus));
apiRouter.get('/tasks/:id/comments', asyncHandler(listComments));
apiRouter.post('/tasks/:id/comments', asyncHandler(addComment));

// Администраторские маршруты
const admin = Router();
admin.use(requireAdmin);
admin.get('/stats', asyncHandler(getStats));
admin.get('/tasks', asyncHandler(listAllTasks));
admin.post('/tasks', asyncHandler(createTask));
admin.get('/users', asyncHandler(listUsers));
admin.get('/assignees', asyncHandler(listAssignees));
admin.get('/reports', asyncHandler(getReport));
apiRouter.use('/admin', admin);
