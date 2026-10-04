import type { Priority, Task, TaskStatus } from '../types';
import { PRIORITY_LABEL, STATUS_LABEL } from '../utils/format';

export function StatusBadge({ status, overdue }: { status: TaskStatus; overdue?: boolean }) {
  if (overdue && status !== 'DONE') {
    return (
      <span className="badge badge-overdue">
        <span className="dot" /> Просрочено
      </span>
    );
  }
  const cls = status.toLowerCase();
  return (
    <span className={`badge badge-${cls}`}>
      <span className="dot" /> {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'NORMAL') return null;
  return <span className={`badge badge-${priority}`}>{PRIORITY_LABEL[priority]}</span>;
}

/** Явный приоритет (всегда виден, включая обычный) — для детальной карточки. */
export function PriorityBadgeAlways({ priority }: { priority: Priority }) {
  return <span className={`badge badge-${priority}`}>{PRIORITY_LABEL[priority]}</span>;
}

export function taskIsOverdue(t: Task): boolean {
  return t.is_overdue;
}
