import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { marketApi } from '../../services/marketApi'
import { walletApi } from '../../services/walletApi'
import { tradingApi } from '../../services/tradingApi'
import { formatVND, formatNumber } from '../../utils/format'
import { sideLabels } from '../../utils/format'
import { useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import ConfirmModal from '../../components/common/ConfirmModal'
import StatusBadge from '../../components/common/StatusBadge'
import { txStatusLabels } from '../../utils/format'

export default function TradePage() {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [selected, setSelected] = useState(symbol || '')
  const [side, setSide] = useState('buy')
  const [quantity, setQuantity] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const market = useApi(() => marketApi.list({ limit: 100 }), [])
  const wallet = useApi(() => walletApi.getWallets(), [])

  // Khi điều hướng từ trang thị trường (/trade/BTC) → đồng bộ mã đang chọn
  useEffect(() => {
    if (symbol) setSelected(symbol.toUpperCase())
  }, [symbol])

  const coins = market.data?.items || []
  const feePercent = market.data?.feePercent ?? 0.5
  const coin = coins.find((c) => c.symbol === (selected || '').toUpperCase())

  const wallets = wallet.data?.items || []
  const vndBalance = wallets.find((w) => w.currencySymbol === 'VND')?.availableBalance || 0
  const coinBalance = wallets.find((w) => w.currencySymbol === coin?.symbol)?.availableBalance || 0

  const qty = useMemo(() => {
    const n = Number(quantity)
    return quantity !== '' && Number.isFinite(n) && n > 0 ? n : 0
  }, [quantity])

  const price = coin?.currentPriceVND || 0
  const totalValue = Math.round(qty * price)
  const fee = Math.round((totalValue * feePercent) / 100)
  const total = side === 'buy' ? totalValue + fee : Math.max(0, totalValue - fee)

  // Nút nhanh theo % số dư
  const applyPercent = (percent) => {
    if (!coin) return
    if (side === 'buy') {
      const usable = vndBalance * percent
      const unit = price * (1 + feePercent / 100)
      const amount = usable / unit
      setQuantity(amount > 0 ? String(Number(amount.toFixed(8))) : '')
    } else {
      const amount = coinBalance * percent
      setQuantity(amount > 0 ? String(Number(amount.toFixed(8))) : '')
    }
  }

  const submit = async () => {
    if (!coin || qty <= 0) return
    setSubmitting(true)
    try {
      // Mỗi lần xác nhận tạo 1 UUID mới → chống gửi trùng lặp (idempotency)
      const res = await tradingApi.createTrade({
        symbol: coin.symbol,
        side,
        quantity: qty,
        idempotencyKey: crypto.randomUUID(),
      })
      setResult(res.data)
      toast(res.message || 'Giao dịch thành công')
      wallet.reload()
      setQuantity('')
    } catch (err) {
      toast(err.message || 'Giao dịch thất bại', 'error')
    } finally {
      setSubmitting(false)
      setConfirmOpen(false)
    }
  }

  if (market.loading || wallet.loading) return <Spinner />
  if (market.error) return <ErrorAlert message={market.error} onRetry={market.reload} />
  if (!coins.length) return <ErrorAlert message="Chưa có tài sản nào được hệ thống hỗ trợ." />

  return (
    <div className="page">
      <h1 className="page-title">Giao dịch</h1>
      <p className="page-subtitle">Lệnh thị trường — khớp ngay theo giá tham khảo hiện tại của hệ thống.</p>

      <div className="trade-layout">
        {/* ==== Bảng đặt lệnh ==== */}
        <div className="card trade-panel">
          <div className="form-group">
            <label htmlFor="trade-symbol">Chọn tài sản</label>
            <select
              id="trade-symbol"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value)
                navigate(`/trade/${e.target.value}`, { replace: true })
              }}
            >
              {coins.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.symbol} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="side-tabs">
            <button
              type="button"
              className={`side-tab buy ${side === 'buy' ? 'active' : ''}`}
              onClick={() => setSide('buy')}
            >
              Mua {coin?.symbol}
            </button>
            <button
              type="button"
              className={`side-tab sell ${side === 'sell' ? 'active' : ''}`}
              onClick={() => setSide('sell')}
            >
              Bán {coin?.symbol}
            </button>
          </div>

          <div className="balance-row">
            <span>
              Số dư VND khả dụng: <strong>{formatVND(vndBalance)}</strong>
            </span>
            <span>
              Số dư {coin?.symbol}: <strong>{formatNumber(coinBalance)}</strong>
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="trade-quantity">Số lượng {coin?.symbol}</label>
            <input
              id="trade-quantity"
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
            />
            <div className="percent-buttons">
              {[0.25, 0.5, 0.75, 1].map((p) => (
                <button key={p} type="button" className="btn btn-sm btn-ghost" onClick={() => applyPercent(p)}>
                  {p * 100}%
                </button>
              ))}
            </div>
          </div>

          <div className="trade-summary">
            <div>
              <span>Giá hiện tại</span>
              <span>{formatVND(price)}</span>
            </div>
            <div>
              <span>Giá trị ước tính</span>
              <span>{formatVND(totalValue)}</span>
            </div>
            <div>
              <span>Phí giao dịch ({feePercent}%)</span>
              <span>{formatVND(fee)}</span>
            </div>
            <div className="trade-total">
              <span>{side === 'buy' ? 'Tổng tiền phải trả' : 'Tổng tiền nhận được'}</span>
              <span>{formatVND(total)}</span>
            </div>
          </div>

          <button
            type="button"
            className={`btn btn-block ${side === 'buy' ? 'btn-success' : 'btn-danger'}`}
            disabled={qty <= 0}
            onClick={() => setConfirmOpen(true)}
          >
            {side === 'buy' ? 'Mua' : 'Bán'} {coin?.symbol}
          </button>
        </div>

        {/* ==== Thông tin tài sản ==== */}
        <div className="card">
          <h2 className="card-title">{coin?.name}</h2>
          <p className={`price-big ${coin?.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
            {formatVND(price)}
          </p>
          <p className={`coin-change ${coin?.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
            {coin?.changePercent >= 0 ? '▲' : '▼'} {Math.abs(coin?.changePercent || 0).toFixed(2)}% trong 24h
          </p>
          <p className="coin-description">{coin?.description}</p>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => { market.reload(); wallet.reload(); toast('Đã làm mới dữ liệu') }}>
            🔄 Làm mới giá
          </button>
        </div>
      </div>

      {/* ==== Kết quả gần nhất ==== */}
      {result?.transaction && (
        <div className="card result-card">
          <h3 className="card-title">Kết quả giao dịch gần nhất</h3>
          <table className="table key-value">
            <tbody>
              <tr>
                <td>Loại lệnh</td>
                <td>
                  {sideLabels[result.transaction.side]} {result.transaction.currencySymbol}
                </td>
              </tr>
              <tr>
                <td>Số lượng</td>
                <td>{formatNumber(result.transaction.quantity)}</td>
              </tr>
              <tr>
                <td>Giá thực hiện</td>
                <td>{formatVND(result.transaction.price)}</td>
              </tr>
              <tr>
                <td>Tổng giá trị</td>
                <td>{formatVND(result.transaction.totalValueVND)}</td>
              </tr>
              <tr>
                <td>Phí</td>
                <td>{formatVND(result.transaction.feeVND)}</td>
              </tr>
              <tr>
                <td>Trạng thái</td>
                <td>
                  <StatusBadge value={result.transaction.status} labels={txStatusLabels} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ==== Xác nhận trước khi thực hiện ==== */}
      <ConfirmModal
        open={confirmOpen}
        title={`Xác nhận ${side === 'buy' ? 'mua' : 'bán'} ${coin?.symbol}`}
        confirmText={side === 'buy' ? 'Xác nhận mua' : 'Xác nhận bán'}
        danger={side === 'sell'}
        loading={submitting}
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
      >
        <table className="table key-value">
          <tbody>
            <tr>
              <td>Số lượng</td>
              <td>
                {formatNumber(qty)} {coin?.symbol}
              </td>
            </tr>
            <tr>
              <td>Giá hiện tại</td>
              <td>{formatVND(price)}</td>
            </tr>
            <tr>
              <td>Phí ({feePercent}%)</td>
              <td>{formatVND(fee)}</td>
            </tr>
            <tr>
              <td>{side === 'buy' ? 'Tổng phải trả' : 'Tổng nhận được'}</td>
              <td>
                <strong>{formatVND(total)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="form-hint">
          ⚠️ Giá cuối cùng do hệ thống xác định tại thời điểm thực hiện. Vui lòng kiểm tra kỹ trước khi
          xác nhận.
        </p>
      </ConfirmModal>
    </div>
  )
}
