import { useNavigate } from 'react-router-dom';
import type { Task } from '../types';
import { formatDateTime } from '../utils/format';
import { PriorityBadge, StatusBadge } from './Badges';

export function TaskCard({ task, showAssignee }: { task: Task; showAssignee?: boolean }) {
  const navigate = useNavigate();
  return (
    <div
      className={`card task-card ${task.is_overdue ? 'is-overdue' : ''}`}
      onClick={() => navigate(`/task/${task.id}`)}
      role="button"
    >
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <h3 className="grow">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="meta">
        <StatusBadge status={task.status} overdue={task.is_overdue} />
        {showAssignee && <span className="small muted">· {task.assignee_name}</span>}
      </div>

      <div className="deadline" style={{ marginTop: 8 }}>
        🕑 Срок: {formatDateTime(task.deadline)}
      </div>
    </div>
  );
}
