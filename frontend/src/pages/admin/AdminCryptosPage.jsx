import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { formatVND, formatDate } from '../../utils/format'
import { useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import ConfirmModal from '../../components/common/ConfirmModal'

const EMPTY_FORM = {
  name: '',
  symbol: '',
  currentPriceVND: '',
  changePercent: '0',
  description: '',
  isActive: true,
}

export default function AdminCryptosPage() {
  const toast = useToast()
  const coins = useApi(() => adminApi.listCryptos(), [])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // coin đang sửa (null = thêm mới)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (coin) => {
    setEditing(coin)
    setForm({
      name: coin.name,
      symbol: coin.symbol,
      currentPriceVND: String(coin.currentPriceVND),
      changePercent: String(coin.changePercent),
      description: coin.description || '',
      isActive: coin.isActive,
    })
    setModalOpen(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        currentPriceVND: Number(form.currentPriceVND),
        changePercent: Number(form.changePercent),
        description: form.description,
        isActive: form.isActive,
      }
      if (editing) {
        await adminApi.updateCrypto(editing.symbol, payload)
        toast('Đã cập nhật tài sản')
      } else {
        await adminApi.createCrypto({ ...payload, symbol: form.symbol })
        toast('Đã thêm tài sản mới')
      }
      setModalOpen(false)
      coins.reload()
    } catch (err) {
      toast(err.message || 'Lưu thất bại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (coin) => {
    try {
      await adminApi.updateCrypto(coin.symbol, { isActive: !coin.isActive })
      toast(coin.isActive ? `Đã ẩn ${coin.symbol} khỏi thị trường` : `Đã hiển thị lại ${coin.symbol}`)
      coins.reload()
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error')
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Quản lý tiền điện tử</h1>
          <p className="page-subtitle">Thêm, sửa, ẩn/hiện tài sản. Mã tài sản không thể thay đổi sau khi tạo.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Thêm tài sản
        </button>
      </div>

      <div className="card">
        {coins.loading ? (
          <Spinner />
        ) : coins.error ? (
          <ErrorAlert message={coins.error} onRetry={coins.reload} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Mã</th>
                  <th className="text-right">Giá tham khảo (VND)</th>
                  <th className="text-right">Biến động 24h</th>
                  <th className="text-center">Trạng thái</th>
                  <th>Cập nhật</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(coins.data?.items || []).map((coin) => (
                  <tr key={coin.symbol} className={coin.isActive ? '' : 'row-muted'}>
                    <td>{coin.name}</td>
                    <td>
                      <span className="symbol-chip">{coin.symbol}</span>
                    </td>
                    <td className="text-right">{formatVND(coin.currentPriceVND)}</td>
                    <td className={`text-right ${coin.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                      {coin.changePercent >= 0 ? '▲' : '▼'} {Math.abs(coin.changePercent).toFixed(2)}%
                    </td>
                    <td className="text-center">
                      <span className={`badge ${coin.isActive ? 'badge-success' : 'badge-muted'}`}>
                        {coin.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td>{formatDate(coin.updatedAt)}</td>
                    <td className="text-right table-actions">
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => openEdit(coin)}>
                        Sửa
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${coin.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleActive(coin)}
                      >
                        {coin.isActive ? 'Ẩn' : 'Hiện'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={modalOpen}
        title={editing ? `Sửa tài sản ${editing.symbol}` : 'Thêm tài sản mới'}
        confirmText={editing ? 'Lưu thay đổi' : 'Thêm tài sản'}
        loading={submitting}
        onConfirm={submit}
        onCancel={() => setModalOpen(false)}
      >
        <form onSubmit={submit} id="crypto-form">
          <div className="form-group">
            <label>Tên hiển thị</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ví dụ: Bitcoin"
              required
              minLength={2}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mã tài sản</label>
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))}
                placeholder="BTC"
                pattern="[A-Z0-9]{2,10}"
                required
                disabled={Boolean(editing)}
              />
            </div>
            <div className="form-group">
              <label>Giá tham khảo (VND)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={form.currentPriceVND}
                onChange={(e) => setForm((p) => ({ ...p, currentPriceVND: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Biến động 24h (%)</label>
            <input
              type="number"
              step="0.01"
              value={form.changePercent}
              onChange={(e) => setForm((p) => ({ ...p, changePercent: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Giới thiệu ngắn về tài sản..."
              maxLength={1000}
            />
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Hiển thị trên thị trường (bỏ chọn để ẩn)
          </label>
        </form>
      </ConfirmModal>
    </div>
  )
}
