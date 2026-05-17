import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Loading from '../../components/Loading';
import { Users, FileCheck, AlertTriangle, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/admin/dashboard').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  const { stats, checkInCompletion, cyclePhase, demoMode } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">{cyclePhase?.label} · {demoMode && <span className="text-amber-600">Demo mode ON</span>}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card"><Users className="text-brand-600 mb-2" size={24} /><p className="text-sm text-slate-500">Employees</p><p className="text-2xl font-bold">{stats?.totalEmployees}</p></div>
        <div className="card"><FileCheck className="text-emerald-500 mb-2" size={24} /><p className="text-sm text-slate-500">Approved</p><p className="text-2xl font-bold">{stats?.approved}</p></div>
        <div className="card"><AlertTriangle className="text-amber-500 mb-2" size={24} /><p className="text-sm text-slate-500">Pending Approval</p><p className="text-2xl font-bold">{stats?.submitted}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Not Started</p><p className="text-2xl font-bold">{stats?.notStarted}</p></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-4">Check-in Completion</h3>
          {(checkInCompletion || []).map((q) => (
            <div key={q.quarter} className="mb-3">
              <div className="flex justify-between text-sm mb-1"><span>{q.quarter}</span><span>{q.completed}/{q.total}</span></div>
              <div className="h-2 bg-slate-100 rounded-full"><div className="h-2 bg-brand-600 rounded-full" style={{ width: `${q.total ? (q.completed / q.total) * 100 : 0}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="card space-y-3">
          <h3 className="font-semibold">Quick Links</h3>
          <Link to="/admin/completion" className="block text-brand-600 hover:underline">Completion Dashboard</Link>
          <Link to="/admin/reports" className="block text-brand-600 hover:underline">Achievement Reports</Link>
          <Link to="/admin/analytics" className="flex items-center gap-1 text-brand-600 hover:underline"><BarChart3 size={16} /> Analytics</Link>
          <Link to="/admin/audit" className="block text-brand-600 hover:underline">Audit Trail</Link>
        </div>
      </div>
    </div>
  );
}
