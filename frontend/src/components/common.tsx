import type { ReactNode } from 'react';

export function Loader({ text }: { text?: string }) {
  return (
    <div className="center-screen">
      <div className="stack" style={{ alignItems: 'center' }}>
        <div className="spinner" />
        {text && <p className="muted small">{text}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ emoji = '📭', title, hint }: { emoji?: string; title: string; hint?: string }) {
  return (
    <div className="empty">
      <div className="emoji">{emoji}</div>
      <p style={{ fontWeight: 600, marginTop: 8 }}>{title}</p>
      {hint && <p className="small muted" style={{ marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return <div className="error-banner">{message}</div>;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented glass">
      {options.map((o) => (
        <button
          key={o.value}
          className={o.value === value ? 'active' : ''}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return <div className="screen">{children}</div>;
}
