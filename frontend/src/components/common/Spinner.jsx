export default function Spinner({ label = 'Đang tải dữ liệu...' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" role="status" aria-label="Đang tải" />
      <p>{label}</p>
    </div>
  )
}
