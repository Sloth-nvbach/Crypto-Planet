import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { formatVND, formatDate, requestStatusLabels } from '../../utils/format'
import { useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function AdminCashPage() {
  const toast = useToast()
  const [tab, setTab] = useState('deposits')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const deposits = useApi(
    () => adminApi.listDeposits({ page, limit: 10, status: statusFilter || undefined }),
    [tab, page, statusFilter, 'dep']
  )
  const withdrawals = useApi(
    () => adminApi.listWithdrawals({ page, limit: 10, status: statusFilter || undefined }),
    [tab, page, statusFilter, 'wd']
  )

  const active = tab === 'deposits' ? deposits : withdrawals

  const doApprove = async () => {
    setSubmitting(true)
    try {
      const res =
        tab === 'deposits'
          ? await adminApi.approveDeposit(approveTarget._id)
          : await adminApi.approveWithdrawal(approveTarget._id)
      toast(res.message || 'Đã phê duyệt')
      setApproveTarget(null)
      active.reload()
    } catch (err) {
      toast(err.message || 'Phê duyệt thất bại', 'error')
      setApproveTarget(null)
    } finally {
      setSubmitting(false)
    }
  }

  const doReject = async () => {
    setSubmitting(true)
    try {
      const res =
        tab === 'deposits'
          ? await adminApi.rejectDeposit(rejectTarget._id, rejectNote)
          : await adminApi.rejectWithdrawal(rejectTarget._id, rejectNote)
      toast(res.message || 'Đã từ chối yêu cầu')
      setRejectTarget(null)
      setRejectNote('')
      active.reload()
    } catch (err) {
      toast(err.message || 'Từ chối thất bại', 'error')
      setRejectTarget(null)
    } finally {
      setSubmitting(false)
    }
  }

  const renderTable = (items) => (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người dùng</th>
              <th className="text-right">Số tiền</th>
              <th className="text-center">Trạng thái</th>
              <th>Ghi chú</th>
              <th>Xử lý bởi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td>{formatDate(r.createdAt)}</td>
                <td>
                  {r.userId ? (
                    <>
                      {r.userId.name}
                      <br />
                      <small>{r.userId.email}</small>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="text-right">{formatVND(r.amountVND)}</td>
                <td className="text-center">
                  <StatusBadge value={r.status} labels={requestStatusLabels} />
                </td>
                <td>{r.adminNote || '—'}</td>
                <td>{r.processedBy?.name || '—'}</td>
                <td className="text-right table-actions">
                  {r.status === 'pending' && (
                    <>
                      <button type="button" className="btn btn-sm btn-success" onClick={() => setApproveTarget(r)}>
                        Duyệt
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => { setRejectTarget(r); setRejectNote('') }}>
                        Từ chối
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={active.data?.page || 1} totalPages={active.data?.totalPages || 1} onChange={setPage} />
    </>
  )

  return (
    <div>
      <h1 className="page-title">Duyệt nạp / rút tiền</h1>
      <p className="page-subtitle">
        Duyệt nạp → cộng số dư ví VND. Duyệt rút → trừ số dư (hệ thống tự kiểm tra đủ tiền). Từ chối không
        làm thay đổi số dư.
      </p>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Mọi trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Bị từ chối</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <div className="card">
        <div className="tab-bar">
          <button type="button" className={`tab ${tab === 'deposits' ? 'active' : ''}`} onClick={() => { setTab('deposits'); setPage(1) }}>
            💰 Yêu cầu nạp
          </button>
          <button type="button" className={`tab ${tab === 'withdrawals' ? 'active' : ''}`} onClick={() => { setTab('withdrawals'); setPage(1) }}>
            🏧 Yêu cầu rút
          </button>
        </div>

        {active.loading ? (
          <Spinner />
        ) : active.error ? (
          <ErrorAlert message={active.error} onRetry={active.reload} />
        ) : !active.data?.items?.length ? (
          <EmptyState message="Không có yêu cầu nào." />
        ) : (
          renderTable(active.data.items)
        )}
      </div>

      {/* Duyệt */}
      <ConfirmModal
        open={Boolean(approveTarget)}
        title={tab === 'deposits' ? 'Duyệt yêu cầu nạp' : 'Duyệt yêu cầu rút'}
        confirmText="Xác nhận duyệt"
        loading={submitting}
        onConfirm={doApprove}
        onCancel={() => setApproveTarget(null)}
      >
        <p>
          {approveTarget?.userId?.name} ({approveTarget?.userId?.email}) —{' '}
          <strong>{formatVND(approveTarget?.amountVND)}</strong>
        </p>
        <p className="form-hint">
          {tab === 'deposits'
            ? 'Số dư VND của người dùng sẽ được cộng đúng số tiền này.'
            : 'Hệ thống sẽ trừ số dư VND tại thời điểm duyệt. Nếu không đủ tiền, thao tác sẽ bị từ chối.'}
        </p>
      </ConfirmModal>

      {/* Từ chối */}
      <ConfirmModal
        open={Boolean(rejectTarget)}
        title="Từ chối yêu cầu"
        confirmText="Xác nhận từ chối"
        danger
        loading={submitting}
        onConfirm={doReject}
        onCancel={() => setRejectTarget(null)}
      >
        <p>
          {rejectTarget?.userId?.name} — <strong>{formatVND(rejectTarget?.amountVND)}</strong>
        </p>
        <div className="form-group">
          <label>Ghi chú cho người dùng</label>
          <input
            type="text"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Ví dụ: Số tiền vượt hạn mức cho phép"
          />
        </div>
        <p className="form-hint">Từ chối KHÔNG làm thay đổi số dư của người dùng.</p>
      </ConfirmModal>
    </div>
  )
}
