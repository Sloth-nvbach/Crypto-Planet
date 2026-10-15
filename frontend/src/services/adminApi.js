import api from './api'

/**
 * Toàn bộ API quản trị — backend kiểm tra quyền admin ở mọi endpoint.
 */
export const adminApi = {
  // Thống kê
  stats: () => api.get('/admin/stats'),

  // Người dùng
  users: (params) => api.get('/admin/users', { params }),
  userDetail: (id) => api.get(`/admin/users/${id}`),
  setUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  adjustBalance: (id, data) => api.post(`/admin/users/${id}/balances`, data),
  userTransactions: (id, params) => api.get(`/admin/users/${id}/transactions`, { params }),
  userBalanceHistories: (id, params) => api.get(`/admin/users/${id}/balance-histories`, { params }),

  // Tiền điện tử
  listCryptos: () => api.get('/admin/cryptocurrencies'),
  createCrypto: (data) => api.post('/admin/cryptocurrencies', data),
  updateCrypto: (symbol, data) => api.put(`/admin/cryptocurrencies/${symbol}`, data),

  // Giao dịch
  listTransactions: (params) => api.get('/admin/transactions', { params }),

  // Nạp / rút
  listDeposits: (params) => api.get('/admin/deposits', { params }),
  approveDeposit: (id) => api.post(`/admin/deposits/${id}/approve`),
  rejectDeposit: (id, adminNote) => api.post(`/admin/deposits/${id}/reject`, { adminNote }),
  listWithdrawals: (params) => api.get('/admin/withdrawals', { params }),
  approveWithdrawal: (id) => api.post(`/admin/withdrawals/${id}/approve`),
  rejectWithdrawal: (id, adminNote) => api.post(`/admin/withdrawals/${id}/reject`, { adminNote }),

  // Hỗ trợ
  listTickets: (params) => api.get('/admin/tickets', { params }),
  respondTicket: (id, data) => api.put(`/admin/tickets/${id}`, data),

  // Nội dung
  listNotifications: (params) => api.get('/admin/notifications', { params }),
  createNotification: (data) => api.post('/admin/notifications', data),
  updateNotification: (id, data) => api.put(`/admin/notifications/${id}`, data),
  deleteNotification: (id) => api.delete(`/admin/notifications/${id}`),

  listFaqs: () => api.get('/admin/faqs'),
  createFaq: (data) => api.post('/admin/faqs', data),
  updateFaq: (id, data) => api.put(`/admin/faqs/${id}`, data),
  deleteFaq: (id) => api.delete(`/admin/faqs/${id}`),

  // Nhật ký
  listAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
}
