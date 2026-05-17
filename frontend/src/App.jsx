import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Loading from './components/Loading';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeGoals from './pages/employee/Goals';
import EmployeeCheckIn from './pages/employee/CheckIn';
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerTeam from './pages/manager/Team';
import ManagerReview from './pages/manager/Review';
import ManagerShared from './pages/manager/SharedGoals';
import ManagerReports from './pages/manager/Reports';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCompletion from './pages/admin/Completion';
import AdminReports from './pages/admin/Reports';
import AdminAnalytics from './pages/admin/Analytics';
import AdminAudit from './pages/admin/Audit';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Loading text="Starting GoalMatrix..." />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />
      <Route path="/" element={<Navigate to={user ? `/${user.role}` : '/login'} />} />

      <Route path="/employee" element={<ProtectedRoute roles={['employee']}><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/employee/goals" element={<ProtectedRoute roles={['employee']}><EmployeeGoals /></ProtectedRoute>} />
      <Route path="/employee/check-in" element={<ProtectedRoute roles={['employee']}><EmployeeCheckIn /></ProtectedRoute>} />

      <Route path="/manager" element={<ProtectedRoute roles={['manager', 'admin']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/team" element={<ProtectedRoute roles={['manager', 'admin']}><ManagerTeam /></ProtectedRoute>} />
      <Route path="/manager/review/:sheetId" element={<ProtectedRoute roles={['manager', 'admin']}><ManagerReview /></ProtectedRoute>} />
      <Route path="/manager/shared" element={<ProtectedRoute roles={['manager', 'admin']}><ManagerShared /></ProtectedRoute>} />
      <Route path="/manager/reports" element={<ProtectedRoute roles={['manager', 'admin']}><ManagerReports /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/completion" element={<ProtectedRoute roles={['admin']}><AdminCompletion /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute roles={['admin']}><AdminAudit /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
