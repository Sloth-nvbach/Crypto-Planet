import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { marketApi } from '../../services/marketApi'
import { formatVND } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/common/Spinner'
import ErrorAlert from '../../components/common/ErrorAlert'

export default function HomePage() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useApi(
    () => marketApi.list({ sort: 'price', order: 'desc', limit: 6 }),
    []
  )

  return (
    <div className="page">
      <section className="hero">
        <h1>
          Khám phá thị trường tiền điện tử cùng <span>Crypto Planet</span>
        </h1>
        <p>
          Theo dõi giá, quản lý tài sản và mua bán mô phỏng — sàn giao dịch luyện tập MERN Stack dành cho
          người mới học lập trình.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/market">
            Xem thị trường
          </Link>
          {user ? (
            <Link className="btn btn-outline" to="/trade">
              Giao dịch ngay
            </Link>
          ) : (
            <Link className="btn btn-outline" to="/register">
              Đăng ký miễn phí
            </Link>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-title-row">
          <h2 className="card-title">Top tiền điện tử theo giá</h2>
          <Link to="/market" className="link">
            Xem tất cả →
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorAlert message={error} onRetry={reload} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Mã</th>
                  <th className="text-right">Giá tham khảo</th>
                  <th className="text-right">Biến động 24h</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((coin) => (
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
                    <td className="text-right">
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
      </section>

      <section className="grid grid-3">
        <div className="card feature">
          <h3>📈 Theo dõi thị trường</h3>
          <p>Giá tham khảo VND do hệ thống quản lý, biến động 24h hiển thị minh bạch, tìm kiếm nhanh.</p>
        </div>
        <div className="card feature">
          <h3>💼 Ví đa tài sản</h3>
          <p>
            Quản lý số dư VND và các đồng crypto, xem tổng tài sản quy đổi và sổ cái biến động chi tiết.
          </p>
        </div>
        <div className="card feature">
          <h3>⚡ Giao dịch mô phỏng</h3>
          <p>
            Mua/bán tức thời theo giá thị trường, phí 0.5%. Không tiền thật — an toàn để luyện tập.
          </p>
        </div>
      </section>
    </div>
  )
}
