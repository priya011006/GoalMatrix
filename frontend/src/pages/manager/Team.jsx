import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { Eye } from 'lucide-react';

export default function ManagerTeam() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/manager/team').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team Goals</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-3 pr-4">Employee</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Department</th>
              <th className="pb-3 pr-4">Goals</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(data?.team || []).map((m) => (
              <tr key={m.employee._id} className="border-b border-slate-50">
                <td className="py-3 font-medium">{m.employee.name}</td>
                <td className="py-3 text-slate-500">{m.employee.email}</td>
                <td className="py-3">{m.employee.department}</td>
                <td className="py-3">{m.goalsCount}</td>
                <td className="py-3"><StatusBadge status={m.status} /></td>
                <td className="py-3">
                  {m.sheet ? (
                    <Link to={`/manager/review/${m.sheet._id}`} className="btn-secondary text-xs py-1.5 px-3">
                      <Eye size={14} /> Review
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs">No sheet</span>
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
