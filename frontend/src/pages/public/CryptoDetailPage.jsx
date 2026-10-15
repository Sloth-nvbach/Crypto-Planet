import { Link, useParams } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { marketApi } from '../../services/marketApi'
import { formatVND } from '../../utils/format'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'

export default function CryptoDetailPage() {
  const { symbol } = useParams()
  const { data, loading, error, reload } = useApi(() => marketApi.detail(symbol), [symbol])

  if (loading) return <Spinner />
  if (error) return <ErrorAlert message={error} onRetry={reload} />

  const coin = data?.cryptocurrency
  const feePercent = data?.feePercent ?? 0.5

  return (
    <div className="page narrow-page">
      <div className="breadcrumb">
        <Link to="/market" className="link">
          ← Thị trường
        </Link>
      </div>

      <div className="card coin-detail">
        <div className="coin-detail-head">
          <div>
            <h1 className="page-title">
              {coin.name} <span className="symbol-chip">{coin.symbol}</span>
            </h1>
            <p className={`price-big ${coin.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
              {formatVND(coin.currentPriceVND)}{' '}
              <small>
                ({coin.changePercent >= 0 ? '▲' : '▼'} {Math.abs(coin.changePercent).toFixed(2)}% trong 24h)
              </small>
            </p>
          </div>
          <Link className="btn btn-primary" to={`/trade/${coin.symbol}`}>
            Mua / Bán {coin.symbol}
          </Link>
        </div>

        <p className="coin-description">{coin.description || 'Chưa có mô tả cho tài sản này.'}</p>

        <div className="coin-meta">
          <div>
            <span className="stat-label">Phí giao dịch</span>
            <span className="stat-value">{feePercent}%</span>
          </div>
          <div>
            <span className="stat-label">Cặp giao dịch</span>
            <span className="stat-value">
              {coin.symbol} / VND
            </span>
          </div>
          <div>
            <span className="stat-label">Trạng thái</span>
            <span className="stat-value">
              <span className="badge badge-success">Đang hỗ trợ</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
