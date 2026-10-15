import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { formatDate, roleLabels, userStatusLabels } from '../../utils/format'
import { useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function AdminUsersPage() {
  const toast = useToast()
  const [filters, setFilters] = useState({ q: '', status: '', page: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [lockTarget, setLockTarget] = useState(null) // { user, newStatus }
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const users = useApi(
    () =>
      adminApi.users({
        page: filters.page,
        limit: 10,
        q: filters.q || undefined,
        status: filters.status || undefined,
      }),
    [filters.page, filters.q, filters.status]
  )

  const submitStatusChange = async () => {
    if (!lockTarget) return
    setSubmitting(true)
    try {
      await adminApi.setUserStatus(lockTarget.user._id, {
        status: lockTarget.newStatus,
        reason,
      })
      toast(lockTarget.newStatus === 'locked' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản')
      setLockTarget(null)
      setReason('')
      users.reload()
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">Quản lý người dùng</h1>

      <div className="filter-bar">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setFilters((prev) => ({ ...prev, q: searchInput, page: 1 }))
          }}
        >
          <input
            type="search"
            placeholder="🔍 Tìm theo tên hoặc email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary">
            Tìm
          </button>
        </form>
        <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">Mọi trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>
      </div>

      <div className="card">
        {users.loading ? (
          <Spinner />
        ) : users.error ? (
          <ErrorAlert message={users.error} onRetry={users.reload} />
        ) : !users.data?.items?.length ? (
          <EmptyState message="Không tìm thấy người dùng phù hợp." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Email</th>
                    <th className="text-center">Vai trò</th>
                    <th className="text-center">Trạng thái</th>
                    <th>Ngày đăng ký</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.items.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td className="text-center">
                        <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-muted'}`}>
                          {roleLabels[u.role]}
                        </span>
                      </td>
                      <td className="text-center">
                        <StatusBadge value={u.status} labels={userStatusLabels} />
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td className="text-right table-actions">
                        <Link className="btn btn-sm btn-ghost" to={`/admin/users/${u._id}`}>
                          Chi tiết
                        </Link>
                        <button
                          type="button"
                          className={`btn btn-sm ${u.status === 'locked' ? 'btn-success' : 'btn-danger'}`}
                          onClick={() => {
                            setLockTarget({ user: u, newStatus: u.status === 'locked' ? 'active' : 'locked' })
                            setReason('')
                          }}
                        >
                          {u.status === 'locked' ? 'Mở khóa' : 'Khóa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={users.data.page}
              totalPages={users.data.totalPages}
              onChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}
      </div>

      <ConfirmModal
        open={Boolean(lockTarget)}
        title={lockTarget?.newStatus === 'locked' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        danger={lockTarget?.newStatus === 'locked'}
        confirmText={lockTarget?.newStatus === 'locked' ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
        loading={submitting}
        onConfirm={submitStatusChange}
        onCancel={() => setLockTarget(null)}
      >
        <p>
          {lockTarget?.newStatus === 'locked'
            ? `Tài khoản "${lockTarget?.user?.name}" (${lockTarget?.user?.email}) sẽ không thể đăng nhập và giao dịch.`
            : `Tài khoản "${lockTarget?.user?.name}" sẽ được hoạt động trở lại.`}
        </p>
        <div className="form-group">
          <label>Lý do (bắt buộc — ghi vào nhật ký hệ thống)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Kiểm tra giao dịch bất thường"
            minLength={3}
          />
        </div>
      </ConfirmModal>
    </div>
  )
}
