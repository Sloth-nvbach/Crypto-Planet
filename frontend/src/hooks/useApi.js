import { useEffect, useState } from 'react'

/**
 * useApi — tải dữ liệu kèm 3 trạng thái bắc buộc của UI:
 * đang tải (loading) / lỗi API (error) / dữ liệu (data).
 *
 * Cách dùng:
 *   const { data, loading, error, reload } = useApi(() => walletApi.getWallets(), [])
 *
 * deps là các giá trị fetcher phụ thuộc — thay đổi thì tự tải lại.
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    Promise.resolve(fetcher())
      .then((result) => {
        // Axios interceptor trả về envelope { success, data, message } — bóc lấy data bên trong
        const payload = result && typeof result === 'object' && 'data' in result ? result.data : result
        if (active) setData(payload)
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Có lỗi xảy ra khi tải dữ liệu')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = () => setTick((t) => t + 1)

  return { data, loading, error, reload, setData }
}
