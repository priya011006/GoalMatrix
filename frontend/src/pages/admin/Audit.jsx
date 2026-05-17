import { useEffect, useState } from 'react';
import client from '../../api/client';
import Loading from '../../components/Loading';

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/admin/audit-logs').then((r) => setLogs(r.data.logs || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Trail</h1>
      <p className="text-slate-500 text-sm">All changes to goals after lock are logged with who, what, and when.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-2 pr-4">Timestamp</th>
              <th className="pb-2 pr-4">User</th>
              <th className="pb-2 pr-4">Role</th>
              <th className="pb-2 pr-4">Action</th>
              <th className="pb-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-b border-slate-50">
                <td className="py-2 pr-4 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="py-2 pr-4">{log.userName || log.userId?.name}</td>
                <td className="py-2 pr-4 capitalize">{log.userRole}</td>
                <td className="py-2 pr-4 font-mono text-xs">{log.action}</td>
                <td className="py-2">{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
