import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { Users, Clock, CheckCircle } from 'lucide-react';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/manager/team').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  const { team, stats } = data || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manager Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4"><Users className="text-brand-600" /><div><p className="text-sm text-slate-500">Team Size</p><p className="text-2xl font-bold">{stats?.total || 0}</p></div></div>
        <div className="card flex items-center gap-4"><Clock className="text-amber-500" /><div><p className="text-sm text-slate-500">Pending Approval</p><p className="text-2xl font-bold">{stats?.pending || 0}</p></div></div>
        <div className="card flex items-center gap-4"><CheckCircle className="text-emerald-500" /><div><p className="text-sm text-slate-500">Approved</p><p className="text-2xl font-bold">{stats?.approved || 0}</p></div></div>
      </div>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Team Overview</h3>
          <Link to="/manager/team" className="text-sm text-brand-600 hover:underline">View all →</Link>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="pb-2">Employee</th><th className="pb-2">Department</th><th className="pb-2">Goals</th><th className="pb-2">Status</th></tr></thead>
          <tbody>
            {(team || []).slice(0, 5).map((m) => (
              <tr key={m.employee._id} className="border-b border-slate-50">
                <td className="py-3">{m.employee.name}</td>
                <td className="py-3">{m.employee.department}</td>
                <td className="py-3">{m.goalsCount}</td>
                <td className="py-3"><StatusBadge status={m.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
