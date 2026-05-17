import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, AlertCircle } from 'lucide-react';
import Alert from '../components/Alert';

const DEMO_USERS = [
  { email: 'employee@goalmatrix.com', role: 'Employee', name: 'John Employee' },
  { email: 'manager@goalmatrix.com', role: 'Manager', name: 'Sarah Manager' },
  { email: 'admin@goalmatrix.com', role: 'Admin', name: 'HR Admin' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setLoading(true);
    setError('');
    try {
      const user = await login(demoEmail, 'password123');
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 text-white flex-col justify-center px-16">
        <div className="flex items-center gap-3 mb-8">
          <Target size={40} className="text-blue-300" />
          <h1 className="text-4xl font-bold">GoalMatrix</h1>
        </div>
        <p className="text-xl text-blue-100 mb-6">In-House Goal Setting & Tracking Portal</p>
        <ul className="space-y-3 text-blue-200">
          <li>Create and align goals with thrust areas</li>
          <li>Manager approval workflow with locking</li>
          <li>Quarterly check-ins and progress tracking</li>
          <li>Shared departmental KPIs</li>
          <li>Audit-ready reporting and governance</li>
        </ul>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Target className="text-brand-600" size={32} />
            <h1 className="text-2xl font-bold text-brand-900">GoalMatrix</h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
          <p className="text-slate-500 mb-8">Sign in to your account</p>
          <Alert type="error" message={error} onClose={() => setError('')} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <div className="mt-8">
            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1"><AlertCircle size={14} /> Quick demo login (password: password123)</p>
            <div className="grid gap-2">
              {DEMO_USERS.map((u) => (
                <button key={u.email} type="button" onClick={() => quickLogin(u.email)} disabled={loading} className="btn-secondary w-full justify-between text-left">
                  <span>{u.name}</span>
                  <span className="text-xs text-slate-400">{u.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
