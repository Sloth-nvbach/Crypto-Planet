import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { formatVND, formatNumber } from '../../utils/format'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'

export default function AdminDashboardPage() {
  const { data, loading, error, reload } = useApi(() => adminApi.stats(), [])

  if (loading) return <Spinner />
  if (error) return <ErrorAlert message={error} onRetry={reload} />

  const stats = data
  const cards = [
    { label: 'Tổng người dùng', value: formatNumber(stats?.totalUsers), hint: `${stats?.lockedUsers || 0} bị khóa` },
    { label: 'Tổng giao dịch', value: formatNumber(stats?.totalTrades), hint: `${stats?.successTrades || 0} thành công / ${stats?.failedTrades || 0} thất bại` },
    { label: 'Tổng khối lượng giao dịch', value: formatVND(stats?.totalVolumeVND), hint: 'Giá trị các lệnh thành công' },
    { label: 'Doanh thu phí giao dịch', value: formatVND(stats?.feeRevenueVND), hint: 'Phí 0.5% từ lệnh thành công' },
    { label: 'Chờ duyệt nạp', value: formatNumber(stats?.pendingDepositCount), hint: `Đã duyệt: ${formatVND(stats?.totalDepositVND)}` },
    { label: 'Chờ duyệt rút', value: formatNumber(stats?.pendingWithdrawalCount), hint: `Đã duyệt: ${formatVND(stats?.totalWithdrawalVND)}` },
  ]

  return (
    <div>
      <h1 className="page-title">Tổng quan hệ thống</h1>

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="card stat-card">
            <span className="stat-label">{c.label}</span>
            <span className="stat-value">{c.value}</span>
            <span className="stat-hint">{c.hint}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="card-title">Khối lượng giao dịch theo tài sản (Top 10)</h2>
        {!stats?.volumeBySymbol?.length ? (
          <EmptyState message="Chưa có giao dịch nào." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tài sản</th>
                  <th className="text-right">Số lệnh thành công</th>
                  <th className="text-right">Khối lượng (VND)</th>
                  <th className="text-right">Phí thu được</th>
                </tr>
              </thead>
              <tbody>
                {stats.volumeBySymbol.map((row) => (
                  <tr key={row.symbol}>
                    <td>
                      <span className="symbol-chip">{row.symbol}</span>
                    </td>
                    <td className="text-right">{formatNumber(row.count)}</td>
                    <td className="text-right">{formatVND(row.volumeVND)}</td>
                    <td className="text-right">{formatVND(row.feeVND)}</td>
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
