import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { Target, ClipboardCheck, Lock } from 'lucide-react';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/goals/my-sheet').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  const sheet = data?.sheet;
  const goals = sheet?.goals || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-slate-500 mt-1">Cycle {sheet?.cycleYear || new Date().getFullYear()} · {data?.cyclePhase?.label}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-slate-500">Sheet Status</p><div className="mt-2"><StatusBadge status={sheet?.status || 'draft'} /></div></div>
        <div className="card"><p className="text-sm text-slate-500">Total Goals</p><p className="text-3xl font-bold mt-1">{goals.length}/8</p></div>
        <div className="card"><p className="text-sm text-slate-500">Total Weightage</p><p className="text-3xl font-bold mt-1">{goals.reduce((s, g) => s + (g.weightage || 0), 0)}%</p></div>
        <div className="card flex items-center gap-2">{sheet?.locked && <Lock className="text-amber-500" size={20} />}<div><p className="text-sm text-slate-500">Locked</p><p className="font-semibold">{sheet?.locked ? 'Yes' : 'No'}</p></div></div>
      </div>

      {sheet?.status === 'rejected' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
          Goals returned for rework: {sheet.rejectionReason}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/employee/goals" className="card hover:border-brand-300 transition group">
          <Target className="text-brand-600 mb-3" size={28} />
          <h3 className="font-semibold group-hover:text-brand-600">Manage Goals</h3>
          <p className="text-sm text-slate-500 mt-1">Create, edit and submit your goal sheet</p>
        </Link>
        <Link to="/employee/check-in" className="card hover:border-brand-300 transition group">
          <ClipboardCheck className="text-brand-600 mb-3" size={28} />
          <h3 className="font-semibold group-hover:text-brand-600">Quarterly Check-in</h3>
          <p className="text-sm text-slate-500 mt-1">Update achievements and progress status</p>
        </Link>
      </div>

      {goals.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Your Goals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-slate-500"><th className="pb-2">Title</th><th className="pb-2">Thrust Area</th><th className="pb-2">Weight</th><th className="pb-2">Target</th></tr></thead>
              <tbody>{goals.map((g) => (<tr key={g._id} className="border-b border-slate-50"><td className="py-2">{g.title}{g.isShared && <span className="ml-1 text-xs text-blue-600">(Shared)</span>}</td><td className="py-2">{g.thrustArea}</td><td className="py-2">{g.weightage}%</td><td className="py-2">{g.target}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
