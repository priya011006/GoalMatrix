import { useEffect, useState } from 'react';
import client from '../../api/client';
import Loading from '../../components/Loading';
import Alert from '../../components/Alert';

export default function ManagerShared() {
  const [employees, setEmployees] = useState([]);
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', thrustArea: '', uomType: 'numeric_min',
    target: '', defaultWeightage: 10, primaryOwnerId: '', recipientIds: [],
  });
  const [sharedList, setSharedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    Promise.all([
      client.get('/shared/employees'),
      client.get('/meta/config'),
      client.get('/shared/list'),
    ]).then(([e, c, l]) => {
      setEmployees(e.data.employees);
      setConfig(c.data);
      setSharedList(l.data.sharedGoals);
    }).finally(() => setLoading(false));
  }, []);

  const toggleRecipient = (id) => {
    const ids = form.recipientIds.includes(id)
      ? form.recipientIds.filter((x) => x !== id)
      : [...form.recipientIds, id];
    setForm({ ...form, recipientIds: ids });
  };

  const push = async (e) => {
    e.preventDefault();
    try {
      await client.post('/shared/push', { ...form, cycleYear: new Date().getFullYear() });
      setMsg({ type: 'success', text: 'Shared KPI pushed to selected employees!' });
      const l = await client.get('/shared/list');
      setSharedList(l.data.sharedGoals);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Push failed' });
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Shared Goals (Department KPI)</h1>
      <p className="text-slate-500 text-sm">Push a KPI to multiple employees. They can adjust weightage only; title and target are read-only.</p>
      <Alert type={msg.type || 'error'} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />

      <form onSubmit={push} className="card space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">KPI Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Thrust Area</label>
            <select className="input" required value={form.thrustArea} onChange={(e) => setForm({ ...form, thrustArea: e.target.value })}>
              <option value="">Select...</option>
              {config?.thrustAreas?.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">UoM</label>
            <select className="input" value={form.uomType} onChange={(e) => setForm({ ...form, uomType: e.target.value })}>
              {config?.uomTypes?.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Target</label>
            <input className="input" required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
          </div>
          <div>
            <label className="label">Default Weightage %</label>
            <input className="input" type="number" min={10} value={form.defaultWeightage} onChange={(e) => setForm({ ...form, defaultWeightage: parseFloat(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Primary Owner (syncs achievements)</label>
            <select className="input" required value={form.primaryOwnerId} onChange={(e) => setForm({ ...form, primaryOwnerId: e.target.value })}>
              <option value="">Select primary owner...</option>
              {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label mb-2 block">Recipients</label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
            {employees.map((emp) => (
              <label key={emp._id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.recipientIds.includes(emp._id)} onChange={() => toggleRecipient(emp._id)} />
                {emp.name}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" className="btn-primary">Push Shared KPI</button>
      </form>

      {sharedList.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Pushed Shared Goals</h3>
          <ul className="space-y-2 text-sm">
            {sharedList.map((s) => (
              <li key={s._id} className="border-b pb-2">
                <span className="font-medium">{s.title}</span> — Target: {s.target} — {s.linkedEntries?.length || 0} recipients
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
