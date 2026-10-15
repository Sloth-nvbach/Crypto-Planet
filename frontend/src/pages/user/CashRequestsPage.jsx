import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { cashApi } from '../../services/cashApi'
import { walletApi } from '../../services/walletApi'
import { formatVND, formatDate, requestStatusLabels } from '../../utils/format'
import { useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmModal from '../../components/common/ConfirmModal'

const MIN_AMOUNT = 50000

export default function CashRequestsPage() {
  const toast = useToast()
  const [tab, setTab] = useState('deposits')
  const [depAmount, setDepAmount] = useState('')
  const [wdAmount, setWdAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)

  const wallets = useApi(() => walletApi.getWallets(), [])
  const deposits = useApi(() => cashApi.listDeposits({ limit: 10 }), [])
  const withdrawals = useApi(() => cashApi.listWithdrawals({ limit: 10 }), [])

  const vndBalance = wallets.data?.items?.find((w) => w.currencySymbol === 'VND')?.availableBalance || 0

  const submitDeposit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await cashApi.createDeposit(Number(depAmount))
      toast(res.message || 'Đã gửi yêu cầu nạp tiền')
      setDepAmount('')
      deposits.reload()
    } catch (err) {
      toast(err.message || 'Gửi yêu cầu thất bại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const submitWithdrawal = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await cashApi.createWithdrawal(Number(wdAmount))
      toast(res.message || 'Đã gửi yêu cầu rút tiền')
      setWdAmount('')
      withdrawals.reload()
    } catch (err) {
      toast(err.message || 'Gửi yêu cầu thất bại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelWithdrawal = async () => {
    try {
      await cashApi.cancelWithdrawal(cancelTarget._id)
      toast('Đã hủy yêu cầu rút tiền')
      setCancelTarget(null)
      withdrawals.reload()
    } catch (err) {
      toast(err.message || 'Hủy yêu cầu thất bại', 'error')
      setCancelTarget(null)
    }
  }

  const requestTable = (items, type) => (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th className="text-right">Số tiền</th>
            <th className="text-center">Trạng thái</th>
            <th>Ghi chú quản trị</th>
            <th>Xử lý lúc</th>
            {type === 'withdrawals' && <th></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r._id}>
              <td>{formatDate(r.createdAt)}</td>
              <td className="text-right">{formatVND(r.amountVND)}</td>
              <td className="text-center">
                <StatusBadge value={r.status} labels={requestStatusLabels} />
              </td>
              <td>{r.adminNote || '—'}</td>
              <td>{r.processedAt ? formatDate(r.processedAt) : '—'}</td>
              {type === 'withdrawals' && (
                <td className="text-right">
                  {r.status === 'pending' && (
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCancelTarget(r)}>
                      Hủy
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="page">
      <h1 className="page-title">Nạp / Rút tiền mô phỏng</h1>
      <p className="page-subtitle">
        Yêu cầu sẽ được quản trị viên phê duyệt. Tối thiểu {formatVND(MIN_AMOUNT)} mỗi yêu cầu. Đây là
        chức năng mô phỏng — không có tiền thật.
      </p>

      <div className="grid grid-2">
        <form className="card" onSubmit={submitDeposit}>
          <h2 className="card-title">💰 Nạp tiền vào ví</h2>
          <p className="form-hint">Số dư VND hiện tại: <strong>{formatVND(vndBalance)}</strong></p>
          <div className="form-group">
            <label htmlFor="dep-amount">Số tiền muốn nạp (VND)</label>
            <input
              id="dep-amount"
              type="number"
              min={MIN_AMOUNT}
              step={1000}
              value={depAmount}
              onChange={(e) => setDepAmount(e.target.value)}
              placeholder={MIN_AMOUNT}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu nạp'}
          </button>
        </form>

        <form className="card" onSubmit={submitWithdrawal}>
          <h2 className="card-title">🏧 Rút tiền khỏi ví</h2>
          <p className="form-hint">Số tiền được trừ khi quản trị viên phê duyệt yêu cầu.</p>
          <div className="form-group">
            <label htmlFor="wd-amount">Số tiền muốn rút (VND)</label>
            <input
              id="wd-amount"
              type="number"
              min={MIN_AMOUNT}
              step={1000}
              value={wdAmount}
              onChange={(e) => setWdAmount(e.target.value)}
              placeholder={MIN_AMOUNT}
              required
            />
          </div>
          <button type="submit" className="btn btn-outline btn-block" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu rút'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="tab-bar">
          <button
            type="button"
            className={`tab ${tab === 'deposits' ? 'active' : ''}`}
            onClick={() => setTab('deposits')}
          >
            Yêu cầu nạp ({deposits.data?.total ?? 0})
          </button>
          <button
            type="button"
            className={`tab ${tab === 'withdrawals' ? 'active' : ''}`}
            onClick={() => setTab('withdrawals')}
          >
            Yêu cầu rút ({withdrawals.data?.total ?? 0})
          </button>
        </div>

        {tab === 'deposits' ? (
          deposits.loading ? (
            <Spinner />
          ) : deposits.error ? (
            <ErrorAlert message={deposits.error} onRetry={deposits.reload} />
          ) : !deposits.data?.items?.length ? (
            <EmptyState message="Chưa có yêu cầu nạp nào." />
          ) : (
            requestTable(deposits.data.items, 'deposits')
          )
        ) : withdrawals.loading ? (
          <Spinner />
        ) : withdrawals.error ? (
          <ErrorAlert message={withdrawals.error} onRetry={withdrawals.reload} />
        ) : !withdrawals.data?.items?.length ? (
          <EmptyState message="Chưa có yêu cầu rút nào." />
        ) : (
          requestTable(withdrawals.data.items, 'withdrawals')
        )}
      </div>

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Hủy yêu cầu rút tiền"
        confirmText="Xác nhận hủy"
        danger
        onConfirm={cancelWithdrawal}
        onCancel={() => setCancelTarget(null)}
      >
        <p>
          Bạn có chắc muốn hủy yêu cầu rút{' '}
          <strong>{cancelTarget ? formatVND(cancelTarget.amountVND) : ''}</strong> đang chờ duyệt?
        </p>
      </ConfirmModal>
    </div>
  )
}
