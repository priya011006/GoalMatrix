import { useEffect, useState } from 'react';
import client from '../../api/client';
import Loading from '../../components/Loading';
import { Download } from 'lucide-react';

export default function AdminReports() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/reports/achievement').then((r) => setRows(r.data.rows || [])).finally(() => setLoading(false));
  }, []);

  const exportFile = async (format) => {
    const res = await client.get('/reports/achievement/export', {
      responseType: 'blob',
      params: { format },
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `achievement-report.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Achievement Reports</h1>
        <div className="flex gap-2">
          <button onClick={() => exportFile('xlsx')} className="btn-primary"><Download size={16} /> Excel</button>
          <button onClick={() => exportFile('csv')} className="btn-secondary"><Download size={16} /> CSV</button>
        </div>
      </div>
      <div className="card overflow-x-auto max-h-[600px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b text-left text-slate-500">
              {['Employee', 'Department', 'Goal', 'Target', 'Quarter', 'Actual', 'Progress', 'Status'].map((h) => (
                <th key={h} className="pb-2 pr-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-1 pr-2">{r.Employee}</td>
                <td className="py-1 pr-2">{r.Department}</td>
                <td className="py-1 pr-2">{r.GoalTitle}</td>
                <td className="py-1 pr-2">{r.Target}</td>
                <td className="py-1 pr-2">{r.Quarter}</td>
                <td className="py-1 pr-2">{r.ActualAchievement}</td>
                <td className="py-1 pr-2">{r.ProgressScore}</td>
                <td className="py-1">{r.Status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
