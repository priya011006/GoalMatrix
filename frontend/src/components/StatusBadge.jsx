import { STATUS_COLORS, formatStatus } from '../utils/helpers';

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600';
  return <span className={`badge ${color}`}>{formatStatus(status)}</span>;
}
