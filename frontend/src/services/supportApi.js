import api from './api'

export const supportApi = {
  createTicket: (data) => api.post('/support/tickets', data),
  listMyTickets: (params) => api.get('/support/tickets', { params }),
  listFaqs: () => api.get('/faqs'),
}

export const contentApi = {
  listNotifications: (params) => api.get('/notifications', { params }),
}
