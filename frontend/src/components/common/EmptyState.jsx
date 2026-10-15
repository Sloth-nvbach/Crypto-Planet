export default function EmptyState({ message = 'Chưa có dữ liệu', children }) {
  return (
    <div className="empty">
      <div className="empty-icon">📭</div>
      <p>{message}</p>
      {children}
    </div>
  )
}
