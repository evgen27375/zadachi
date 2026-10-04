import { useState } from 'react';
import type { Comment } from '../types';
import { formatDateTime } from '../utils/format';
import { addComment } from '../api/endpoints';
import { ApiError } from '../api/client';

const MAX_LEN = 2000;

export function CommentSection({
  taskId,
  comments,
  onAdded,
}: {
  taskId: string;
  comments: Comment[];
  onAdded: (c: Comment) => void;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      const c = await addComment(taskId, trimmed);
      onAdded(c);
      setText('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось отправить комментарий');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="stack">
      {comments.length === 0 && <p className="small muted">Комментариев пока нет.</p>}
      {comments.map((c) => (
        <div key={c.id} className={`comment ${c.author_role === 'ADMIN' ? 'by-admin' : ''}`}>
          <div className="row-between">
            <span className="author">
              {c.author_name}
              {c.author_role === 'ADMIN' && <span className="faint small"> · админ</span>}
            </span>
            <span className="time">{formatDateTime(c.created_at)}</span>
          </div>
          <div className="text">{c.text}</div>
        </div>
      ))}

      <div className="field" style={{ marginTop: 4 }}>
        <textarea
          className="textarea"
          placeholder="Напишите комментарий…"
          value={text}
          maxLength={MAX_LEN}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row-between">
          <span className="faint small">
            {text.length}/{MAX_LEN}
          </span>
          <button className="btn btn-primary" disabled={!text.trim() || sending} onClick={submit}>
            {sending ? 'Отправка…' : 'Отправить'}
          </button>
        </div>
        {error && <div className="error-banner">{error}</div>}
      </div>
    </div>
  );
}
