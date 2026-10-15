import api from './api'

export const cashApi = {
  createDeposit: (amountVND) => api.post('/deposits', { amountVND }),
  listDeposits: (params) => api.get('/deposits', { params }),

  createWithdrawal: (amountVND) => api.post('/withdrawals', { amountVND }),
  listWithdrawals: (params) => api.get('/withdrawals', { params }),
  cancelWithdrawal: (id) => api.post(`/withdrawals/${id}/cancel`),
}
