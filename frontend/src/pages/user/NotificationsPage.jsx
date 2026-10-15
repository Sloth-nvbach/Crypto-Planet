import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { contentApi } from '../../services/supportApi'
import { formatDate, notificationTypeLabels } from '../../utils/format'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useApi(
    () => contentApi.listNotifications({ page, limit: 10 }),
    [page]
  )

  return (
    <div className="page narrow-page">
      <h1 className="page-title">Thông báo hệ thống</h1>
      <p className="page-subtitle">Các thông báo mới nhất từ Crypto Planet.</p>

      <div className="card">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorAlert message={error} onRetry={reload} />
        ) : !data?.items?.length ? (
          <EmptyState message="Chưa có thông báo nào." />
        ) : (
          <>
            <div className="notification-list">
              {data.items.map((n) => (
                <div key={n._id} className="notification-card">
                  <div className="notification-head">
                    <strong>{n.title}</strong>
                    <span className={`badge badge-type-${n.type}`}>{notificationTypeLabels[n.type] || n.type}</span>
                  </div>
                  <p>{n.content}</p>
                  <span className="notification-date">{formatDate(n.createdAt)}</span>
                </div>
              ))}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
