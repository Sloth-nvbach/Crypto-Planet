import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { formatDate, notificationTypeLabels } from '../../utils/format'
import { useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function AdminContentPage() {
  const toast = useToast()
  const [tab, setTab] = useState('notifications')

  // ==== Thông báo ====
  const notifications = useApi(() => adminApi.listNotifications({ limit: 50 }), ['noti'])
  const [notiForm, setNotiForm] = useState({ title: '', content: '', type: 'announcement', isPublished: true })
  const [savingNoti, setSavingNoti] = useState(false)

  const submitNotification = async (e) => {
    e.preventDefault()
    setSavingNoti(true)
    try {
      await adminApi.createNotification(notiForm)
      toast('Đã đăng thông báo')
      setNotiForm({ title: '', content: '', type: 'announcement', isPublished: true })
      notifications.reload()
    } catch (err) {
      toast(err.message || 'Đăng thông báo thất bại', 'error')
    } finally {
      setSavingNoti(false)
    }
  }

  const toggleNotification = async (n) => {
    try {
      await adminApi.updateNotification(n._id, { isPublished: !n.isPublished })
      toast(n.isPublished ? 'Đã ẩn thông báo' : 'Đã hiển thị thông báo')
      notifications.reload()
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error')
    }
  }

  const deleteNotification = async (n) => {
    if (!window.confirm(`Xóa thông báo "${n.title}"?`)) return
    try {
      await adminApi.deleteNotification(n._id)
      toast('Đã xóa thông báo')
      notifications.reload()
    } catch (err) {
      toast(err.message || 'Xóa thất bại', 'error')
    }
  }

  // ==== FAQ ====
  const faqs = useApi(() => adminApi.listFaqs(), ['faq'])
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', order: 0, isActive: true })
  const [editingFaq, setEditingFaq] = useState(null)
  const [savingFaq, setSavingFaq] = useState(false)

  const submitFaq = async (e) => {
    e.preventDefault()
    setSavingFaq(true)
    try {
      if (editingFaq) {
        await adminApi.updateFaq(editingFaq._id, faqForm)
        toast('Đã cập nhật câu hỏi')
      } else {
        await adminApi.createFaq(faqForm)
        toast('Đã thêm câu hỏi')
      }
      setFaqForm({ question: '', answer: '', order: 0, isActive: true })
      setEditingFaq(null)
      faqs.reload()
    } catch (err) {
      toast(err.message || 'Lưu thất bại', 'error')
    } finally {
      setSavingFaq(false)
    }
  }

  const editFaq = (faq) => {
    setEditingFaq(faq)
    setFaqForm({ question: faq.question, answer: faq.answer, order: faq.order, isActive: faq.isActive })
  }

  const deleteFaq = async (faq) => {
    if (!window.confirm(`Xóa câu hỏi "${faq.question}"?`)) return
    try {
      await adminApi.deleteFaq(faq._id)
      toast('Đã xóa câu hỏi')
      faqs.reload()
    } catch (err) {
      toast(err.message || 'Xóa thất bại', 'error')
    }
  }

  return (
    <div>
      <h1 className="page-title">Quản lý nội dung</h1>

      <div className="tab-bar page-tabs">
        <button type="button" className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>
          📢 Thông báo hệ thống
        </button>
        <button type="button" className={`tab ${tab === 'faqs' ? 'active' : ''}`} onClick={() => setTab('faqs')}>
          ❓ Câu hỏi thường gặp
        </button>
      </div>

      {tab === 'notifications' ? (
        <div className="grid grid-2">
          <form className="card" onSubmit={submitNotification}>
            <h2 className="card-title">Đăng thông báo mới</h2>
            <div className="form-group">
              <label>Tiêu đề</label>
              <input
                type="text"
                value={notiForm.title}
                onChange={(e) => setNotiForm((p) => ({ ...p, title: e.target.value }))}
                required
                minLength={3}
              />
            </div>
            <div className="form-group">
              <label>Nội dung</label>
              <textarea
                rows={4}
                value={notiForm.content}
                onChange={(e) => setNotiForm((p) => ({ ...p, content: e.target.value }))}
                required
                minLength={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Loại</label>
                <select value={notiForm.type} onChange={(e) => setNotiForm((p) => ({ ...p, type: e.target.value }))}>
                  {Object.entries(notificationTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={notiForm.isPublished}
                  onChange={(e) => setNotiForm((p) => ({ ...p, isPublished: e.target.checked }))}
                />
                Hiển thị ngay
              </label>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={savingNoti}>
              {savingNoti ? 'Đang đăng...' : 'Đăng thông báo'}
            </button>
          </form>

          <div className="card">
            <h2 className="card-title">Danh sách thông báo</h2>
            {notifications.loading ? (
              <Spinner />
            ) : notifications.error ? (
              <ErrorAlert message={notifications.error} onRetry={notifications.reload} />
            ) : !notifications.data?.items?.length ? (
              <EmptyState message="Chưa có thông báo nào." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th className="text-center">Loại</th>
                      <th className="text-center">Hiển thị</th>
                      <th>Ngày đăng</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.data.items.map((n) => (
                      <tr key={n._id}>
                        <td>{n.title}</td>
                        <td className="text-center">{notificationTypeLabels[n.type] || n.type}</td>
                        <td className="text-center">
                          <span className={`badge ${n.isPublished ? 'badge-success' : 'badge-muted'}`}>
                            {n.isPublished ? 'Đang hiện' : 'Bản nháp'}
                          </span>
                        </td>
                        <td>{formatDate(n.createdAt)}</td>
                        <td className="text-right table-actions">
                          <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleNotification(n)}>
                            {n.isPublished ? 'Ẩn' : 'Hiện'}
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteNotification(n)}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          <form className="card" onSubmit={submitFaq}>
            <h2 className="card-title">{editingFaq ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h2>
            <div className="form-group">
              <label>Câu hỏi</label>
              <input
                type="text"
                value={faqForm.question}
                onChange={(e) => setFaqForm((p) => ({ ...p, question: e.target.value }))}
                required
                minLength={5}
              />
            </div>
            <div className="form-group">
              <label>Câu trả lời</label>
              <textarea
                rows={4}
                value={faqForm.answer}
                onChange={(e) => setFaqForm((p) => ({ ...p, answer: e.target.value }))}
                required
                minLength={5}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Thứ tự hiển thị</label>
                <input
                  type="number"
                  min={0}
                  value={faqForm.order}
                  onChange={(e) => setFaqForm((p) => ({ ...p, order: Number(e.target.value) }))}
                />
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={faqForm.isActive}
                  onChange={(e) => setFaqForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                Hiển thị
              </label>
            </div>
            <div className="form-row">
              <button type="submit" className="btn btn-primary" disabled={savingFaq}>
                {savingFaq ? 'Đang lưu...' : editingFaq ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
              </button>
              {editingFaq && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditingFaq(null)
                    setFaqForm({ question: '', answer: '', order: 0, isActive: true })
                  }}
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </form>

          <div className="card">
            <h2 className="card-title">Danh sách FAQ</h2>
            {faqs.loading ? (
              <Spinner />
            ) : faqs.error ? (
              <ErrorAlert message={faqs.error} onRetry={faqs.reload} />
            ) : !faqs.data?.items?.length ? (
              <EmptyState message="Chưa có câu hỏi nào." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Câu hỏi</th>
                      <th className="text-center">Hiển thị</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqs.data.items.map((faq) => (
                      <tr key={faq._id}>
                        <td>{faq.order}</td>
                        <td>
                          <strong>{faq.question}</strong>
                          <br />
                          <small>{faq.answer}</small>
                        </td>
                        <td className="text-center">
                          <span className={`badge ${faq.isActive ? 'badge-success' : 'badge-muted'}`}>
                            {faq.isActive ? 'Có' : 'Không'}
                          </span>
                        </td>
                        <td className="text-right table-actions">
                          <button type="button" className="btn btn-sm btn-ghost" onClick={() => editFaq(faq)}>
                            Sửa
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteFaq(faq)}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
