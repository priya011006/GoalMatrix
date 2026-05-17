import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Target,
  Users,
  FileText,
  BarChart3,
  Shield,
  LogOut,
  Share2,
  ClipboardCheck,
} from 'lucide-react';

const NAV = {
  employee: [
    { to: '/employee', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employee/goals', label: 'My Goals', icon: Target },
    { to: '/employee/check-in', label: 'Check-in', icon: ClipboardCheck },
  ],
  manager: [
    { to: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/team', label: 'Team Goals', icon: Users },
    { to: '/manager/shared', label: 'Shared Goals', icon: Share2 },
    { to: '/manager/reports', label: 'Reports', icon: FileText },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/completion', label: 'Completion', icon: ClipboardCheck },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/audit', label: 'Audit Trail', icon: Shield },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = NAV[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-brand-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight">GoalMatrix</h1>
          <p className="text-xs text-blue-200 mt-1">Goal Setting & Tracking</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                location.pathname === to || location.pathname.startsWith(to + '/')
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-blue-200 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-100 hover:bg-white/10 transition"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {links.find((l) => location.pathname.startsWith(l.to))?.label || 'GoalMatrix'}
            </h2>
            <span className="text-sm text-slate-500">{user?.department}</span>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
