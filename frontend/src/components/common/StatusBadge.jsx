// Ánh xạ giá trị enum → màu badge hiển thị
const CLASS_MAP = {
  completed: 'success',
  approved: 'success',
  answered: 'success',
  active: 'success',
  failed: 'danger',
  rejected: 'danger',
  locked: 'danger',
  pending: 'warning',
  open: 'warning',
  cancelled: 'muted',
  closed: 'muted',
}

/**
 * StatusBadge — hiển thị trạng thái bằng tiếng Việt với màu đúng语义.
 * Cách dùng: <StatusBadge value={tx.status} labels={txStatusLabels} />
 */
export default function StatusBadge({ value, labels = {} }) {
  if (!value) return <span className="badge badge-muted">—</span>
  return <span className={`badge badge-${CLASS_MAP[value] || 'muted'}`}>{labels[value] || value}</span>
}
