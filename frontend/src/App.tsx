import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, getDisplayUserId } from './context/AuthContext';
import { BottomNav } from './components/BottomNav';
import { Loader } from './components/common';

import Dashboard from './pages/admin/Dashboard';
import TasksPage from './pages/admin/TasksPage';
import NewTaskPage from './pages/admin/NewTaskPage';
import PeoplePage from './pages/admin/PeoplePage';
import ReportsPage from './pages/admin/ReportsPage';
import MyTasks from './pages/user/MyTasks';
import DonePage from './pages/user/DonePage';
import TaskDetail from './pages/TaskDetail';

export default function App() {
  const { me, loading, error } = useAuth();

  if (loading) return <Loader text="Авторизация через MAX…" />;

  if (error || !me) {
    const uid = getDisplayUserId();
    return (
      <div className="center-screen">
        <div className="card stack" style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 34 }}>🔒</div>
          <h2>Не удалось войти</h2>
          <p className="muted small">{error ?? 'Нет данных авторизации MAX.'}</p>
          {uid && <p className="faint small">Ваш MAX ID: {uid}</p>}
          <p className="faint small">
            Откройте это приложение внутри мессенджера MAX через вашего бота.
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = me.role === 'ADMIN';

  return (
    <div className="app">
      <Routes>
        {isAdmin ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/new" element={<NewTaskPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </>
        ) : (
          <>
            <Route path="/" element={<MyTasks />} />
            <Route path="/done" element={<DonePage />} />
          </>
        )}
        <Route path="/task/:id" element={<TaskDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <BottomNav role={me.role} />
    </div>
  );
}
