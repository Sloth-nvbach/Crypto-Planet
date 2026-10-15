import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { walletApi } from '../../services/walletApi'
import { formatVND, formatNumber, formatDate } from '../../utils/format'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'

export default function WalletPage() {
  const wallets = useApi(() => walletApi.getWallets(), [])
  const histories = useApi(() => walletApi.histories({ limit: 10 }), [])

  if (wallets.loading) return <Spinner />
  if (wallets.error) return <ErrorAlert message={wallets.error} onRetry={wallets.reload} />

  const items = wallets.data?.items || []
  const totalValueVND = wallets.data?.totalValueVND || 0

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tài sản của tôi</h1>
          <p className="page-subtitle">Tổng giá trị tài sản quy đổi theo giá tham khảo hiện tại.</p>
        </div>
        <Link className="btn btn-primary" to="/cash">
          Nạp / Rút tiền
        </Link>
      </div>

      <div className="total-banner card">
        <span className="stat-label">Tổng giá trị tài sản</span>
        <span className="total-value">{formatVND(totalValueVND)}</span>
      </div>

      <div className="card">
        <h2 className="card-title">Số dư từng loại tài sản</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tài sản</th>
                <th>Mã</th>
                <th className="text-right">Số dư khả dụng</th>
                <th className="text-right">Giá tham khảo</th>
                <th className="text-right">Giá trị quy đổi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.currencySymbol}>
                  <td>{w.name}</td>
                  <td>
                    <span className="symbol-chip">{w.currencySymbol}</span>
                  </td>
                  <td className="text-right">{formatNumber(w.availableBalance)}</td>
                  <td className="text-right">{w.currencySymbol === 'VND' ? '—' : formatVND(w.currentPriceVND)}</td>
                  <td className="text-right">
                    <strong>{formatVND(w.valueVND)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title-row">
          <h2 className="card-title">Biến động số dư gần đây</h2>
          <span className="form-hint">Sổ cái ghi lại mọi thay đổi số dư</span>
        </div>
        {histories.loading ? (
          <Spinner />
        ) : histories.error ? (
          <ErrorAlert message={histories.error} onRetry={histories.reload} />
        ) : !histories.data?.items?.length ? (
          <EmptyState message="Chưa có biến động số dư nào. Hãy thực hiện giao dịch đầu tiên!" />
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
    </div>
  )
}
