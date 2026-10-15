import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import {
  formatVND,
  formatNumber,
  formatDate,
  roleLabels,
  userStatusLabels,
  txTypeLabels,
  txStatusLabels,
  sideLabels,
} from '../../utils/format'
import { useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function AdminUserDetailPage() {
  const { id } = useParams()
  const toast = useToast()

  const [adjust, setAdjust] = useState({ currencySymbol: 'VND', changeAmount: '', reason: '' })
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [txPage, setTxPage] = useState(1)

  const detail = useApi(() => adminApi.userDetail(id), [id])
  const cryptos = useApi(() => adminApi.listCryptos(), [])
  const transactions = useApi(() => adminApi.userTransactions(id, { page: txPage, limit: 10 }), [id, txPage])
  const histories = useApi(() => adminApi.userBalanceHistories(id, { limit: 10 }), [id, 'histories'])

  if (detail.loading) return <Spinner />
  if (detail.error) return <ErrorAlert message={detail.error} onRetry={detail.reload} />

  const { user, wallets, summary } = detail.data || {}

  const submitAdjust = async () => {
    setSubmitting(true)
    try {
      await adminApi.adjustBalance(id, {
        currencySymbol: adjust.currencySymbol,
        changeAmount: Number(adjust.changeAmount),
        reason: adjust.reason,
      })
      toast('Đã điều chỉnh số dư và ghi vào nhật ký hệ thống')
      setAdjustOpen(false)
      setAdjust({ currencySymbol: 'VND', changeAmount: '', reason: '' })
      detail.reload()
      transactions.reload()
      histories.reload()
    } catch (err) {
      toast(err.message || 'Điều chỉnh thất bại', 'error')
      setSubmitting(false)
      return
    }
    setSubmitting(false)
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/admin/users" className="link">
          ← Danh sách người dùng
        </Link>
      </div>
      <h1 className="page-title">{user?.name}</h1>

      <div className="grid grid-2">
        {/* Thông tin + khóa/mở */}
        <div className="card">
          <h2 className="card-title">Thông tin tài khoản</h2>
          <table className="table key-value">
            <tbody>
              <tr>
                <td>Email</td>
                <td>{user?.email}</td>
              </tr>
              <tr>
                <td>Vai trò</td>
                <td>{roleLabels[user?.role]}</td>
              </tr>
              <tr>
                <td>Trạng thái</td>
                <td>
                  <StatusBadge value={user?.status} labels={userStatusLabels} />
                </td>
              </tr>
              <tr>
                <td>Ngày đăng ký</td>
                <td>{formatDate(user?.createdAt)}</td>
              </tr>
              <tr>
                <td>Tổng giao dịch</td>
                <td>
                  {summary?.tradeCount || 0} giao dịch · {summary?.depositCount || 0} nạp ·{' '}
                  {summary?.withdrawalCount || 0} rút
                </td>
              </tr>
            </tbody>
          </table>
          <p className="form-hint">Mật khẩu được hash bằng bcrypt — không ai xem được mật khẩu gốc.</p>
        </div>

        {/* Ví + điều chỉnh số dư */}
        <div className="card">
          <div className="card-title-row">
            <h2 className="card-title">Số dư tài sản</h2>
            <button type="button" className="btn btn-sm btn-warning-outline" onClick={() => setAdjustOpen(true)}>
              ⚙️ Điều chỉnh số dư
            </button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tài sản</th>
                  <th className="text-right">Số dư</th>
                  <th className="text-right">Giá trị quy đổi</th>
                </tr>
              </thead>
              <tbody>
                {(wallets?.items || []).map((w) => (
                  <tr key={w.currencySymbol}>
                    <td>
                      <span className="symbol-chip">{w.currencySymbol}</span> {w.name}
                    </td>
                    <td className="text-right">{formatNumber(w.availableBalance)}</td>
                    <td className="text-right">{formatVND(w.valueVND)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>
                    <strong>Tổng giá trị tài sản</strong>
                  </td>
                  <td className="text-right">
                    <strong>{formatVND(wallets?.totalValueVND)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Giao dịch của user */}
      <div className="card">
        <h2 className="card-title">Lịch sử giao dịch</h2>
        {transactions.loading ? (
          <Spinner />
        ) : transactions.error ? (
          <ErrorAlert message={transactions.error} onRetry={transactions.reload} />
        ) : !transactions.data?.items?.length ? (
          <EmptyState message="Người dùng này chưa có giao dịch nào." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Loại</th>
                    <th>Tài sản</th>
                    <th className="text-right">Số lượng</th>
                    <th className="text-right">Giá trị</th>
                    <th className="text-center">Trạng thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.data.items.map((tx) => (
                    <tr key={tx._id}>
                      <td>{formatDate(tx.createdAt)}</td>
                      <td>
                        {txTypeLabels[tx.type]}
                        {tx.side ? ` (${sideLabels[tx.side]})` : ''}
                      </td>
                      <td>
                        <span className="symbol-chip">{tx.currencySymbol}</span>
                      </td>
                      <td className="text-right">{formatNumber(tx.quantity)}</td>
                      <td className="text-right">{formatVND(tx.totalValueVND)}</td>
                      <td className="text-center">
                        <StatusBadge value={tx.status} labels={txStatusLabels} />
                      </td>
                      <td>{tx.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={transactions.data.page} totalPages={transactions.data.totalPages} onChange={setTxPage} />
          </>
        )}
      </div>

      {/* Sổ cái */}
      <div className="card">
        <h2 className="card-title">Biến động số dư (sổ cái)</h2>
        {histories.loading ? (
          <Spinner />
        ) : !histories.data?.items?.length ? (
          <EmptyState message="Chưa có biến động số dư." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Tài sản</th>
                  <th>Nội dung</th>
                  <th className="text-right">Thay đổi</th>
                  <th className="text-right">Số dư sau</th>
                </tr>
              </thead>
              <tbody>
                {histories.data.items.map((h) => (
                  <tr key={h._id}>
                    <td>{formatDate(h.createdAt)}</td>
                    <td>
                      <span className="symbol-chip">{h.walletId?.currencySymbol || '—'}</span>
                    </td>
                    <td>{h.reason}</td>
                    <td className={`text-right ${h.changeAmount >= 0 ? 'price-up' : 'price-down'}`}>
                      {h.changeAmount >= 0 ? '+' : ''}
                      {formatNumber(h.changeAmount)}
                    </td>
                    <td className="text-right">{formatNumber(h.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal điều chỉnh số dư */}
      <ConfirmModal
        open={adjustOpen}
        title="Điều chỉnh số dư (kiểm thử)"
        confirmText="Thực hiện điều chỉnh"
        loading={submitting}
        onConfirm={submitAdjust}
        onCancel={() => setAdjustOpen(false)}
      >
        <div className="form-group">
          <label>Tài sản</label>
          <select
            value={adjust.currencySymbol}
            onChange={(e) => setAdjust((p) => ({ ...p, currencySymbol: e.target.value }))}
          >
            <option value="VND">VND</option>
            {(cryptos.data?.items || []).map((c) => (
              <option key={c.symbol} value={c.symbol}>
                {c.symbol}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Số lượng thay đổi (dùng số âm để trừ)</label>
          <input
            type="number"
            step="any"
            value={adjust.changeAmount}
            onChange={(e) => setAdjust((p) => ({ ...p, changeAmount: e.target.value }))}
            placeholder="Ví dụ: 1000000 hoặc -500000"
            required
          />
        </div>
        <div className="form-group">
          <label>Lý do (bắt buộc)</label>
          <input
            type="text"
            value={adjust.reason}
            onChange={(e) => setAdjust((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Ví dụ: Đền bù sự cố giao dịch #123"
            minLength={5}
            required
          />
        </div>
        <p className="form-hint">
          ⚠️ Điều chỉnh sẽ hiển thị minh bạch trong lịch sử của người dùng và ghi vào nhật ký hệ thống.
        </p>
      </ConfirmModal>
    </div>
  )
}
