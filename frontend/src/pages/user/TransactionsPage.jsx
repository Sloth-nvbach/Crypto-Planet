import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { tradingApi } from '../../services/tradingApi'
import { marketApi } from '../../services/marketApi'
import { formatVND, formatNumber, formatDate, txStatusLabels, sideLabels } from '../../utils/format'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'

export default function TransactionsPage() {
  const [filters, setFilters] = useState({ symbol: '', side: '', status: '', page: 1 })

  const coins = useApi(() => marketApi.list({ limit: 100 }), [])
  const trades = useApi(
    () =>
      tradingApi.listTrades({
        page: filters.page,
        limit: 10,
        symbol: filters.symbol || undefined,
        side: filters.side || undefined,
        status: filters.status || undefined,
      }),
    [filters.page, filters.symbol, filters.side, filters.status]
  )

  const changeFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 })) // đổi bộ lọc → về trang 1
  }

  return (
    <div className="page">
      <h1 className="page-title">Lịch sử giao dịch</h1>
      <p className="page-subtitle">Toàn bộ lệnh mua/bán đã thực hiện trên tài khoản của bạn.</p>

      <div className="filter-bar">
        <select value={filters.symbol} onChange={(e) => changeFilter('symbol', e.target.value)}>
          <option value="">Tất cả tài sản</option>
          {(coins.data?.items || []).map((c) => (
            <option key={c.symbol} value={c.symbol}>
              {c.symbol}
            </option>
          ))}
        </select>
        <select value={filters.side} onChange={(e) => changeFilter('side', e.target.value)}>
          <option value="">Mua & Bán</option>
          <option value="buy">Mua</option>
          <option value="sell">Bán</option>
        </select>
        <select value={filters.status} onChange={(e) => changeFilter('status', e.target.value)}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(txStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {trades.loading ? (
          <Spinner />
        ) : trades.error ? (
          <ErrorAlert message={trades.error} onRetry={trades.reload} />
        ) : !trades.data?.items?.length ? (
          <EmptyState message="Chưa có giao dịch nào khớp bộ lọc." />
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
                    <th className="text-right">Giá</th>
                    <th className="text-right">Tổng giá trị</th>
                    <th className="text-right">Phí</th>
                    <th className="text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.data.items.map((tx) => (
                    <tr key={tx._id}>
                      <td>{formatDate(tx.createdAt)}</td>
                      <td>
                        <span className={`badge ${tx.side === 'buy' ? 'badge-buy' : 'badge-sell'}`}>
                          {sideLabels[tx.side]}
                        </span>
                      </td>
                      <td>
                        <span className="symbol-chip">{tx.currencySymbol}</span>
                      </td>
                      <td className="text-right">{formatNumber(tx.quantity)}</td>
                      <td className="text-right">{formatVND(tx.price)}</td>
                      <td className="text-right">{formatVND(tx.totalValueVND)}</td>
                      <td className="text-right">{formatVND(tx.feeVND)}</td>
                      <td className="text-center">
                        <StatusBadge value={tx.status} labels={txStatusLabels} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={trades.data.page}
              totalPages={trades.data.totalPages}
              onChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}
      </div>
    </div>
  )
}
