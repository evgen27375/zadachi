import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTask, fetchAssignees } from '../../api/endpoints';
import type { Assignee, Priority } from '../../types';
import { ErrorBanner, Loader, Screen, Segmented } from '../../components/common';
import { ApiError } from '../../api/client';

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'NORMAL', label: 'Обычный' },
  { value: 'IMPORTANT', label: 'Важный' },
  { value: 'URGENT', label: 'Срочный' },
];

export default function NewTaskPage() {
  const navigate = useNavigate();
  const [assignees, setAssignees] = useState<Assignee[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('NORMAL');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignees()
      .then((list) => {
        setAssignees(list);
        if (list.length > 0) setAssigneeId(list[0].id);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const canSubmit = title.trim() && assigneeId && deadline && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || null,
        assignee_id: assigneeId,
        deadline: new Date(deadline).toISOString(),
        priority,
      });
      navigate('/tasks');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось создать задачу');
      setSubmitting(false);
    }
  };

  if (loadError) return <Screen><ErrorBanner message={loadError} /></Screen>;
  if (!assignees) return <Loader text="Загрузка…" />;

  return (
    <Screen>
      <button className="back-btn" onClick={() => navigate(-1)}>← Назад</button>
      <div className="screen-header">
        <h1>Новая задача</h1>
      </div>

      <div className="card stack" style={{ gap: 16 }}>
        <div className="field">
          <label>Название *</label>
          <input
            className="input"
            value={title}
            maxLength={200}
            placeholder="Например: Подготовить отчёт"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Описание</label>
          <textarea
            className="textarea"
            value={description}
            maxLength={4000}
            placeholder="Необязательно"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Исполнитель *</label>
          {assignees.length === 0 ? (
            <p className="small muted">
              Пока нет пользователей. Попросите сотрудников открыть Mini App или написать боту —
              они появятся в списке.
            </p>
          ) : (
            <select
              className="select"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.first_name}
                  {a.username ? ` (@${a.username})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="field">
          <label>Дедлайн *</label>
          <input
            className="input"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Приоритет</label>
          <Segmented options={PRIORITIES} value={priority} onChange={setPriority} />
        </div>

        {error && <ErrorBanner message={error} />}

        <button className="btn btn-primary btn-lg btn-block" disabled={!canSubmit} onClick={submit}>
          {submitting ? 'Создание…' : 'Создать задачу'}
        </button>
      </div>
    </Screen>
  );
}
