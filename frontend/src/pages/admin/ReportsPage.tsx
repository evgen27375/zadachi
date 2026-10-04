import { useEffect, useState } from 'react';
import { fetchReport } from '../../api/endpoints';
import type { Report } from '../../types';
import { ErrorBanner, Loader, Screen, Segmented } from '../../components/common';

type Range = 'current_week' | 'last_week' | 'last_30_days';

const RANGES: { value: Range; label: string }[] = [
  { value: 'current_week', label: 'Эта неделя' },
  { value: 'last_week', label: 'Прошлая' },
  { value: 'last_30_days', label: '30 дней' },
];

export default function ReportsPage() {
  const [range, setRange] = useState<Range>('current_week');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReport(null);
    setError(null);
    fetchReport(range)
      .then(setReport)
      .catch((e: Error) => setError(e.message));
  }, [range]);

  return (
    <Screen>
      <div className="screen-header">
        <h1>Отчёты</h1>
        <p className="subtitle">Статистика по задачам</p>
      </div>

      <Segmented options={RANGES} value={range} onChange={setRange} />
      <div style={{ height: 14 }} />

      {error && <ErrorBanner message={error} />}
      {!report && !error && <Loader text="Формирование отчёта…" />}

      {report && (
        <div className="stack">
          <div className="stat-grid">
            <div className="card stat">
              <div className="value">{report.totals.done}</div>
              <div className="label">Выполнено за период</div>
            </div>
            <div className="card stat">
              <div className="value">{report.totals.in_progress}</div>
              <div className="label">В процессе сейчас</div>
            </div>
            <div className="card stat">
              <div className="value">{report.totals.not_started}</div>
              <div className="label">Не начато сейчас</div>
            </div>
            <div className="card stat danger">
              <div className="value">{report.totals.overdue}</div>
              <div className="label">Просрочено сейчас</div>
            </div>
          </div>

          <div className="section-title">По сотрудникам</div>
          {report.perUser.length === 0 ? (
            <p className="small muted">Нет данных за выбранный период.</p>
          ) : (
            report.perUser.map((u) => (
              <div className="card" key={u.user_id}>
                <div style={{ fontWeight: 650, marginBottom: 8 }}>{u.name}</div>
                <div className="row wrap" style={{ gap: 14 }}>
                  <Metric label="Выполнено" value={u.done} />
                  <Metric label="В процессе" value={u.in_progress} />
                  <Metric label="Не начато" value={u.not_started} />
                  <Metric label="Просрочено" value={u.overdue} danger={u.overdue > 0} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Screen>
  );
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, color: danger ? 'var(--danger)' : undefined }}>
        {value}
      </div>
      <div className="faint small">{label}</div>
    </div>
  );
}
