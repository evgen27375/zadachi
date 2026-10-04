import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchTask, updateTaskStatus } from '../api/endpoints';
import type { Comment, TaskDetail as TaskDetailData, TaskStatus } from '../types';
import { ErrorBanner, Loader, Screen } from '../components/common';
import { PriorityBadgeAlways, StatusBadge } from '../components/Badges';
import { CommentSection } from '../components/CommentSection';
import { HistoryList } from '../components/HistoryList';
import { formatDateTime } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { me } = useAuth();

  const [data, setData] = useState<TaskDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = () => {
    if (!id) return;
    fetchTask(id)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  };

  useEffect(load, [id]);

  if (error) {
    return (
      <Screen>
        <button className="back-btn" onClick={() => navigate(-1)}>← Назад</button>
        <ErrorBanner message={error} />
      </Screen>
    );
  }
  if (!data) return <Loader text="Загрузка задачи…" />;

  const { task, comments, history } = data;
  const isAssignee = me?.id === task.assignee_id;

  const changeStatus = async (status: TaskStatus) => {
    if (!id || working) return;
    setWorking(true);
    setError(null);
    try {
      await updateTaskStatus(id, status);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось изменить статус');
    } finally {
      setWorking(false);
    }
  };

  const onCommentAdded = (c: Comment) =>
    setData((prev) => (prev ? { ...prev, comments: [...prev.comments, c] } : prev));

  return (
    <Screen>
      <button className="back-btn" onClick={() => navigate(-1)}>← Назад</button>

      <div className="card stack">
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <h1 className="grow" style={{ fontSize: 22 }}>{task.title}</h1>
          <PriorityBadgeAlways priority={task.priority} />
        </div>

        <div className="row wrap">
          <StatusBadge status={task.status} overdue={task.is_overdue} />
        </div>

        {task.description && (
          <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{task.description}</p>
        )}

        <div className="stack" style={{ gap: 6 }}>
          <InfoRow label="Срок" value={formatDateTime(task.deadline)} danger={task.is_overdue} />
          <InfoRow label="Создана" value={formatDateTime(task.created_at)} />
          {task.completed_at && <InfoRow label="Выполнена" value={formatDateTime(task.completed_at)} />}
          {me?.role === 'ADMIN' && <InfoRow label="Исполнитель" value={task.assignee_name} />}
        </div>

        {/* Кнопки действий — только для исполнителя */}
        {isAssignee && task.status === 'NOT_STARTED' && (
          <button className="btn btn-primary btn-block" disabled={working} onClick={() => changeStatus('IN_PROGRESS')}>
            Начать выполнение
          </button>
        )}
        {isAssignee && task.status === 'IN_PROGRESS' && (
          <button className="btn btn-primary btn-block" disabled={working} onClick={() => changeStatus('DONE')}>
            Отметить выполненной
          </button>
        )}
      </div>

      <div className="section-title">Комментарии</div>
      <div className="card">
        {id && <CommentSection taskId={id} comments={comments} onAdded={onCommentAdded} />}
      </div>

      {me?.role === 'ADMIN' && history && (
        <>
          <div className="section-title">История</div>
          <div className="card">
            <HistoryList history={history} />
          </div>
        </>
      )}
    </Screen>
  );
}

function InfoRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="row-between">
      <span className="muted small">{label}</span>
      <span className="small" style={{ fontWeight: 600, color: danger ? 'var(--danger)' : undefined }}>
        {value}
      </span>
    </div>
  );
}
