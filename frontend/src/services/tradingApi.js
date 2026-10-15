import api from './api'

export const tradingApi = {
  // Tạo lệnh mua/bán — idempotencyKey là UUID mới cho mỗi lần bấm xác nhận
  createTrade: (data) => api.post('/trades', data),
  listTrades: (params) => api.get('/trades', { params }),
  getTrade: (id) => api.get(`/trades/${id}`),
}
