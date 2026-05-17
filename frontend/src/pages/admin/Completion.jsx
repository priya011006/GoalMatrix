import { useEffect, useState } from 'react';
import client from '../../api/client';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';

export default function AdminCompletion() {
  const [data, setData] = useState(null);
  const [quarter, setQuarter] = useState('Q1');
  const [loading, setLoading] = useState(true);

  const load = (q) => {
    setLoading(true);
    client.get('/admin/completion-dashboard', { params: { quarter: q } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(quarter); }, [quarter]);

  const unlock = async (sheetId) => {
    if (!confirm('Unlock this goal sheet for editing?')) return;
    await client.post(`/admin/unlock/${sheetId}`);
    load(quarter);
  };

  if (loading && !data) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Completion Dashboard</h1>
      <div className="flex gap-2">
        {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
          <button key={q} onClick={() => setQuarter(q)} className={`px-4 py-2 rounded-lg text-sm font-medium ${quarter === q ? 'bg-brand-600 text-white' : 'border bg-white'}`}>{q}</button>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-2">Employee</th>
              <th className="pb-2">Manager</th>
              <th className="pb-2">Goal Status</th>
              <th className="pb-2">Check-in Done</th>
              <th className="pb-2">Manager Comment</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.rows || []).map((r, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-2">{r.employee.name}</td>
                <td className="py-2">{r.manager?.name || '—'}</td>
                <td className="py-2"><StatusBadge status={r.goalStatus} /></td>
                <td className="py-2">{r.checkInDone ? 'Yes' : 'No'}</td>
                <td className="py-2">{r.managerCommentDone ? 'Yes' : 'No'}</td>
                <td className="py-2">
                  {r.sheetId && r.goalStatus === 'approved' && (
                    <button type="button" onClick={() => unlock(r.sheetId)} className="text-xs text-brand-600 hover:underline">Unlock goals</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
