import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { supportApi } from '../../services/supportApi'
import { formatDate, ticketStatusLabels } from '../../utils/format'
import { useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'

export default function SupportPage() {
  const toast = useToast()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const faqs = useApi(() => supportApi.listFaqs(), [])
  const tickets = useApi(() => supportApi.listMyTickets({ limit: 20 }), [])

  const submitTicket = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await supportApi.createTicket({ subject, message })
      toast(res.message || 'Đã gửi yêu cầu hỗ trợ')
      setSubject('')
      setMessage('')
      tickets.reload()
    } catch (err) {
      toast(err.message || 'Gửi yêu cầu thất bại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Hỗ trợ khách hàng</h1>
      <p className="page-subtitle">Tìm câu trả lời nhanh trong FAQ hoặc gửi yêu cầu hỗ trợ cho quản trị viên.</p>

      <div className="grid grid-2">
        {/* ==== FAQ ==== */}
        <div className="card">
          <h2 className="card-title">❓ Câu hỏi thường gặp</h2>
          {faqs.loading ? (
            <Spinner />
          ) : faqs.error ? (
            <ErrorAlert message={faqs.error} onRetry={faqs.reload} />
          ) : !faqs.data?.items?.length ? (
            <EmptyState message="Chưa có câu hỏi thường gặp." />
          ) : (
            <div className="faq-list">
              {faqs.data.items.map((faq) => (
                <details key={faq._id} className="faq-item">
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          )}
        </div>

        {/* ==== Gửi yêu cầu hỗ trợ ==== */}
        <form className="card" onSubmit={submitTicket}>
          <h2 className="card-title">✉️ Gửi yêu cầu hỗ trợ</h2>
          <div className="form-group">
            <label htmlFor="ticket-subject">Tiêu đề</label>
            <input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ví dụ: Không nhận được tiền sau khi nạp"
              minLength={5}
              maxLength={100}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="ticket-message">Nội dung</label>
            <textarea
              id="ticket-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mô tả rõ vấn đề bạn gặp phải..."
              minLength={10}
              maxLength={2000}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </form>
      </div>

      {/* ==== Ticket của tôi ==== */}
      <div className="card">
        <h2 className="card-title">Yêu cầu hỗ trợ của tôi</h2>
        {tickets.loading ? (
          <Spinner />
        ) : tickets.error ? (
          <ErrorAlert message={tickets.error} onRetry={tickets.reload} />
        ) : !tickets.data?.items?.length ? (
          <EmptyState message="Bạn chưa gửi yêu cầu hỗ trợ nào." />
        ) : (
          <div className="ticket-list">
            {tickets.data.items.map((t) => (
              <div key={t._id} className="ticket-card">
                <div className="ticket-head">
                  <strong>{t.subject}</strong>
                  <StatusBadge value={t.status} labels={ticketStatusLabels} />
                </div>
                <p className="ticket-message">{t.message}</p>
                <p className="ticket-date">{formatDate(t.createdAt)}</p>
                {t.adminResponse && (
                  <div className="ticket-response">
                    <strong>🎧 Phản hồi từ quản trị viên:</strong>
                    <p>{t.adminResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
