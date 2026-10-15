export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null
  return (
    <div className="pagination">
      <button type="button" className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Trước
      </button>
      <span className="pagination-info">
        Trang {page} / {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Sau →
      </button>
    </div>
  )
}
