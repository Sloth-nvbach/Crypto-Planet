import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { formatDate, ticketStatusLabels } from '../../utils/format'
import { useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function AdminTicketsPage() {
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState(null)
  const [response, setResponse] = useState('')
  const [nextStatus, setNextStatus] = useState('answered')
  const [submitting, setSubmitting] = useState(false)

  const tickets = useApi(() => adminApi.listTickets({ status: status || undefined, page, limit: 10 }), [
    status,
    page,
    'tick',
  ])

  const submitResponse = async () => {
    setSubmitting(true)
    try {
      await adminApi.respondTicket(target._id, { adminResponse: response, status: nextStatus })
      toast(nextStatus === 'answered' ? 'Đã gửi phản hồi' : 'Đã đóng yêu cầu hỗ trợ')
      setTarget(null)
      setResponse('')
      tickets.reload()
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">Yêu cầu hỗ trợ khách hàng</h1>

      <div className="filter-bar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(ticketStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {tickets.loading ? (
          <Spinner />
        ) : tickets.error ? (
          <ErrorAlert message={tickets.error} onRetry={tickets.reload} />
        ) : !tickets.data?.items?.length ? (
          <EmptyState message="Không có yêu cầu hỗ trợ nào." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Người dùng</th>
                    <th>Tiêu đề</th>
                    <th className="text-center">Trạng thái</th>
                    <th>Phản hồi</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.data.items.map((t) => (
                    <tr key={t._id}>
                      <td>{formatDate(t.createdAt)}</td>
                      <td>
                        {t.userId ? (
                          <>
                            {t.userId.name}
                            <br />
                            <small>{t.userId.email}</small>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <strong>{t.subject}</strong>
                        <br />
                        <small>{t.message}</small>
                      </td>
                      <td className="text-center">
                        <StatusBadge value={t.status} labels={ticketStatusLabels} />
                      </td>
                      <td className="response-cell">{t.adminResponse || '—'}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setTarget(t)
                            setResponse(t.adminResponse || '')
                            setNextStatus('answered')
                          }}
                        >
                          Phản hồi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={tickets.data.page} totalPages={tickets.data.totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <ConfirmModal
        open={Boolean(target)}
        title="Phản hồi yêu cầu hỗ trợ"
        confirmText="Gửi phản hồi"
        loading={submitting}
        onConfirm={submitResponse}
        onCancel={() => setTarget(null)}
      >
        <p className="ticket-context">
          <strong>{target?.subject}</strong> — {target?.userId?.name}
        </p>
        <p className="ticket-context">{target?.message}</p>
        <div className="form-group">
          <label>Nội dung phản hồi</label>
          <textarea
            rows={4}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Nhập nội dung phản hồi cho người dùng..."
            maxLength={2000}
          />
        </div>
        <div className="form-group">
          <label>Cập nhật trạng thái</label>
          <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
            <option value="answered">Đã phản hồi</option>
            <option value="closed">Đã đóng</option>
          </select>
        </div>
      </ConfirmModal>
    </div>
  )
}
