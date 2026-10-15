/**
 * ConfirmModal — hộp thoại xác nhận cho các hành động quan trọng
 * (khóa tài khoản, duyệt nạp/rút, tạo giao dịch...).
 */
export default function ConfirmModal({
  open,
  title,
  children,
  confirmText = 'Xác nhận',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel?.()
      }}
    >
      <div className="modal">
        <h3 className="modal-title">{title}</h3>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Hủy
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
