export default function ErrorAlert({ message = 'Có lỗi khi tải dữ liệu', onRetry }) {
  return (
    <div className="alert alert-error">
      <span>⚠️ {message}</span>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-ghost" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  )
}
