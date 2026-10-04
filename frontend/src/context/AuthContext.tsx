import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchMe } from '../api/endpoints';
import { isDemo } from '../api/demo';
import { getInitData, getUnsafeUser } from '../max/bridge';
import type { Me } from '../types';

interface AuthState {
  me: Me | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const AuthContext = createContext<AuthState>({
  me: null,
  loading: true,
  error: null,
  reload: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    if (!isDemo && !getInitData()) {
      setError(
        'Не удалось получить данные авторизации MAX. Откройте приложение внутри мессенджера MAX.',
      );
      setLoading(false);
      return;
    }

    fetchMe()
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <AuthContext.Provider value={{ me, loading, error, reload: () => setTick((t) => t + 1) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** ID пользователя из небезопасных данных — только для экрана ошибки/входа. */
export const getDisplayUserId = (): string | null => {
  const u = getUnsafeUser();
  return u ? String(u.id) : null;
};
