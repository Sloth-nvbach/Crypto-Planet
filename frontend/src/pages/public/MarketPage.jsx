import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { marketApi } from '../../services/marketApi'
import { formatVND } from '../../utils/format'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'

export default function MarketPage() {
  const [query, setQuery] = useState('')
  const { data, loading, error, reload } = useApi(() => marketApi.list({ limit: 100 }), [])

  const coins = useMemo(() => {
    const items = data?.items || []
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    )
  }, [data, query])

  return (
    <div className="page">
      <h1 className="page-title">Thị trường</h1>
      <p className="page-subtitle">Danh sách tiền điện tử được Crypto Planet hỗ trợ giao dịch.</p>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="🔍 Tìm theo tên hoặc mã (ví dụ: Bitcoin, BTC...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="card">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorAlert message={error} onRetry={reload} />
        ) : coins.length === 0 ? (
          <EmptyState message="Không tìm thấy tài sản phù hợp với từ khóa." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Mã</th>
                  <th className="text-right">Giá tham khảo</th>
                  <th className="text-right">Biến động 24h</th>
                  <th className="text-center">Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin) => (
                  <tr key={coin.symbol}>
                    <td>
                      <Link className="link" to={`/market/${coin.symbol}`}>
                        {coin.name}
                      </Link>
                    </td>
                    <td>
                      <span className="symbol-chip">{coin.symbol}</span>
                    </td>
                    <td className="text-right">{formatVND(coin.currentPriceVND)}</td>
                    <td className={`text-right ${coin.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                      {coin.changePercent >= 0 ? '▲' : '▼'} {Math.abs(coin.changePercent).toFixed(2)}%
                    </td>
                    <td className="text-center">
                      <span className="badge badge-success">Đang hỗ trợ</span>
                    </td>
                    <td className="text-right table-actions">
                      <Link className="btn btn-sm btn-ghost" to={`/market/${coin.symbol}`}>
                        Chi tiết
                      </Link>
                      <Link className="btn btn-sm btn-primary" to={`/trade/${coin.symbol}`}>
                        Giao dịch
                      </Link>
                    </td>
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
