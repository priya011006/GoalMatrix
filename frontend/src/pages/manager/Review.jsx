import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import Loading from '../../components/Loading';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { calcTotalWeight } from '../../utils/helpers';
import { Check, X, Save } from 'lucide-react';

export default function ManagerReview() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [goals, setGoals] = useState([]);
  const [comment, setComment] = useState('');
  const [quarter, setQuarter] = useState('Q1');
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    client.get(`/manager/sheet/${sheetId}`).then((r) => {
      setSheet(r.data.sheet);
      setGoals(r.data.sheet.goals || []);
    }).finally(() => setLoading(false));
  }, [sheetId]);

  const canEdit = sheet?.status === 'submitted';
  const totalWeight = calcTotalWeight(goals);

  const saveEdits = async () => {
    try {
      const res = await client.put(`/manager/sheet/${sheetId}`, { goals });
      setSheet(res.data.sheet);
      setGoals(res.data.sheet.goals);
      setMsg({ type: 'success', text: 'Goals updated.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const approve = async () => {
    try {
      await client.post(`/manager/approve/${sheetId}`);
      setMsg({ type: 'success', text: 'Goals approved and locked!' });
      navigate('/manager/team');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Approval failed' });
    }
  };

  const reject = async () => {
    try {
      await client.post(`/manager/reject/${sheetId}`, { reason: rejectReason });
      setMsg({ type: 'success', text: 'Returned for rework.' });
      navigate('/manager/team');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Reject failed' });
    }
  };

  const addComment = async () => {
    try {
      await client.post(`/manager/check-in-comment/${sheetId}`, { quarter, comment });
      setMsg({ type: 'success', text: 'Check-in comment saved.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  if (loading) return <Loading />;
  const emp = sheet?.employeeId;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <button onClick={() => navigate('/manager/team')} className="text-sm text-brand-600 mb-2">← Back to team</button>
        <h1 className="text-2xl font-bold">{emp?.name}&apos;s Goal Sheet</h1>
        <p className="text-slate-500">{emp?.email} · <StatusBadge status={sheet?.status} /></p>
      </div>

      <Alert type={msg.type || 'error'} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />

      <div className={`text-sm font-medium px-4 py-2 rounded-lg ${totalWeight === 100 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
        Total Weightage: {totalWeight}%
      </div>

      {goals.map((g, i) => (
        <div key={g._id} className="card grid md:grid-cols-4 gap-3 text-sm">
          <div className="md:col-span-2"><span className="text-slate-500">Title</span><p className="font-medium">{g.title}</p></div>
          <div><span className="text-slate-500">Target</span>{canEdit ? <input className="input mt-1" value={g.target} onChange={(e) => { const n = [...goals]; n[i].target = e.target.value; setGoals(n); }} /> : <p className="font-medium">{g.target}</p>}</div>
          <div><span className="text-slate-500">Weight %</span>{canEdit ? <input className="input mt-1" type="number" value={g.weightage} onChange={(e) => { const n = [...goals]; n[i].weightage = parseFloat(e.target.value); setGoals(n); }} /> : <p className="font-medium">{g.weightage}%</p>}</div>
        </div>
      ))}

      {canEdit && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={saveEdits} className="btn-secondary"><Save size={16} /> Save Edits</button>
          <button onClick={approve} className="btn-primary" disabled={totalWeight !== 100}><Check size={16} /> Approve & Lock</button>
          <button onClick={reject} className="btn-danger"><X size={16} /> Return for Rework</button>
        </div>
      )}

      {canEdit && (
        <input className="input" placeholder="Rejection reason (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      )}

      {sheet?.status === 'approved' && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Check-in Review</h3>
          <div className="flex gap-2">{['Q1','Q2','Q3','Q4'].map((q) => (
            <button key={q} onClick={() => setQuarter(q)} className={`px-3 py-1 rounded text-sm ${quarter === q ? 'bg-brand-600 text-white' : 'border'}`}>{q}</button>
          ))}</div>
          {goals.map((g) => {
            const ci = sheet.checkIns?.find((c) => c.quarter === quarter && c.goalId === g._id);
            return (
              <div key={g._id} className="border-t pt-3 text-sm grid md:grid-cols-4 gap-2">
                <p className="font-medium md:col-span-2">{g.title}</p>
                <p>Target: {g.target}</p>
                <p>Actual: {ci?.actualAchievement || '—'} {ci?.progressScore != null && `(${ci.progressScore.toFixed(0)}%)`}</p>
              </div>
            );
          })}
          <textarea className="input" rows={3} placeholder="Check-in comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
          <button onClick={addComment} className="btn-primary">Save Comment</button>
          {sheet.managerComments?.filter((c) => c.quarter === quarter).map((c, i) => (
            <div key={i} className="bg-slate-50 rounded p-3 text-sm"><p>{c.comment}</p><p className="text-xs text-slate-400 mt-1">{new Date(c.createdAt).toLocaleString()}</p></div>
          ))}
        </div>
      )}
    </div>
  );
}
