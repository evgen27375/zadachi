import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReport } from '../../api/endpoints';
import type { Report } from '../../types';
import { ErrorBanner, Loader, Screen, Segmented } from '../../components/common';
import { Header } from '../../components/Header';
import { IconArrowUp, IconCircle, IconClock, IconList } from '../../components/Icons';

type Range = 'current_week' | 'last_week' | 'last_30_days';

const RANGES: { value: Range; label: string }[] = [
  { value: 'current_week', label: 'Эта неделя' },
  { value: 'last_week', label: 'Прошлая' },
  { value: 'last_30_days', label: '30 дней' },
];

export default function ReportsPage() {
  const navigate = useNavigate();
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
      <Header title="Отчёты" subtitle="Статистика по задачам" />

      <Segmented options={RANGES} value={range} onChange={setRange} />
      <div style={{ height: 16 }} />

      {error && <ErrorBanner message={error} />}
      {!report && !error && <Loader text="Формирование отчёта…" />}

      {report && (
        <>
          <div className="stat-grid">
            <div className="stat tappable" role="button" onClick={() => navigate('/tasks?filter=done')}>
              <div className="value">{report.totals.done}</div>
              <div className="label">Выполнено за период</div>
              <span className="chip chip-green"><IconArrowUp size={18} /></span>
            </div>
            <div className="stat tappable" role="button" onClick={() => navigate('/tasks?filter=in_progress')}>
              <div className="value">{report.totals.in_progress}</div>
              <div className="label">В процессе сейчас</div>
              <span className="chip chip-indigo"><IconCircle size={18} /></span>
            </div>
            <div className="stat tappable" role="button" onClick={() => navigate('/tasks?filter=not_started')}>
              <div className="value">{report.totals.not_started}</div>
              <div className="label">Не начато сейчас</div>
              <span className="chip chip-grey"><IconList size={18} /></span>
            </div>
            <div className="stat tappable" role="button" onClick={() => navigate('/tasks?filter=overdue')}>
              <div className="value" style={{ color: report.totals.overdue ? 'var(--red)' : undefined }}>
                {report.totals.overdue}
              </div>
              <div className="label">Просрочено сейчас</div>
              <span className="chip chip-red"><IconClock size={18} /></span>
            </div>
          </div>

          <div className="section-title">По сотрудникам</div>
          {report.perUser.length === 0 ? (
            <p className="small muted" style={{ padding: '0 2px' }}>Нет данных за выбранный период.</p>
          ) : (
            <div className="stack">
              {report.perUser.map((u) => (
                <div className="card" key={u.user_id}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{u.name}</div>
                  <div className="metrics" style={{ flexWrap: 'wrap', gap: 20 }}>
                    <Metric label="Выполнено" value={u.done} />
                    <Metric label="В процессе" value={u.in_progress} />
                    <Metric label="Не начато" value={u.not_started} />
                    <Metric label="Просрочено" value={u.overdue} danger={u.overdue > 0} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Screen>
  );
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="m">
      <div className="n" style={{ color: danger ? 'var(--red)' : undefined }}>{value}</div>
      <div className="t">{label}</div>
    </div>
  );
}
