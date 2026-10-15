import api from './api'

export const walletApi = {
  getWallets: () => api.get('/wallets'),
  histories: (params) => api.get('/wallets/histories', { params }),
}
