import type { HistoryEntry } from '../types';
import { EVENT_LABEL, formatDateTime } from '../utils/format';

export function HistoryList({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return <p className="small muted">История пуста.</p>;
  return (
    <div className="stack" style={{ gap: 0 }}>
      {history.map((h, i) => (
        <div className="history-item" key={h.id}>
          <div className="tl">
            <span className="pt" />
            {i < history.length - 1 && <span className="ln" />}
          </div>
          <div style={{ paddingBottom: 14 }}>
            <div style={{ fontWeight: 600 }}>{EVENT_LABEL[h.event_type]}</div>
            <div className="faint small">
              {formatDateTime(h.created_at)}
              {h.actor_name ? ` · ${h.actor_name}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
