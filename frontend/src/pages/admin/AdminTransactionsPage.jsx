import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import {
  formatVND,
  formatNumber,
  formatDate,
  txTypeLabels,
  txStatusLabels,
  sideLabels,
} from '../../utils/format'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'

export default function AdminTransactionsPage() {
  const [filters, setFilters] = useState({ email: '', type: '', status: '', symbol: '', page: 1 })
  const [emailInput, setEmailInput] = useState('')

  const transactions = useApi(
    () =>
      adminApi.listTransactions({
        page: filters.page,
        limit: 10,
        email: filters.email || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        symbol: filters.symbol || undefined,
      }),
    [filters.page, filters.email, filters.type, filters.status, filters.symbol]
  )

  return (
    <div>
      <h1 className="page-title">Toàn bộ giao dịch hệ thống</h1>
      <p className="page-subtitle">Lọc theo email người dùng, loại giao dịch, tài sản và trạng thái.</p>

      <div className="filter-bar">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setFilters((p) => ({ ...p, email: emailInput, page: 1 }))
          }}
        >
          <input
            type="search"
            placeholder="🔍 Email người dùng..."
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary">
            Lọc
          </button>
        </form>
        <select value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value, page: 1 }))}>
          <option value="">Mọi loại</option>
          {Object.entries(txTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(txStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={filters.symbol} onChange={(e) => setFilters((p) => ({ ...p, symbol: e.target.value, page: 1 }))}>
          <option value="">Mọi tài sản</option>
          <option value="VND">VND</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
          <option value="SOL">SOL</option>
        </select>
      </div>

      <div className="card">
        {transactions.loading ? (
          <Spinner />
        ) : transactions.error ? (
          <ErrorAlert message={transactions.error} onRetry={transactions.reload} />
        ) : !transactions.data?.items?.length ? (
          <EmptyState message="Không có giao dịch nào khớp bộ lọc." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Người dùng</th>
                    <th>Loại</th>
                    <th>Tài sản</th>
                    <th className="text-right">Số lượng</th>
                    <th className="text-right">Tổng giá trị</th>
                    <th className="text-right">Phí</th>
                    <th className="text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.data.items.map((tx) => (
                    <tr key={tx._id}>
                      <td>{formatDate(tx.createdAt)}</td>
                      <td>
                        {tx.userId ? (
                          <>
                            {tx.userId.name}
                            <br />
                            <small>{tx.userId.email}</small>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {txTypeLabels[tx.type]}
                        {tx.side ? ` (${sideLabels[tx.side]})` : ''}
                      </td>
                      <td>
                        <span className="symbol-chip">{tx.currencySymbol}</span>
                      </td>
                      <td className="text-right">{formatNumber(tx.quantity)}</td>
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
              page={transactions.data.page}
              totalPages={transactions.data.totalPages}
              onChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}
      </div>
    </div>
  )
}
