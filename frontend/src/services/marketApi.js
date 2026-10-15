import api from './api'

export const marketApi = {
  // Danh sách + tìm kiếm + sắp xếp: { q, sort, order, page, limit }
  list: (params) => api.get('/market/cryptocurrencies', { params }),
  detail: (symbol) => api.get(`/market/cryptocurrencies/${symbol}`),
}
