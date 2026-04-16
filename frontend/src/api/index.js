import axios from 'axios'
import client from './client'

const optimizerClient = axios.create({
  baseURL: import.meta.env.VITE_ALGO_URL || 'http://localhost:8001',
  headers: { 'Content-Type': 'application/json' },
})

// Auth
export const authApi = {
  login: (data) => client.post('/auth/login', data),
  register: (data) => client.post('/auth/register', data),
  me: () => client.get('/auth/me'),
  updateAccount: (data) => client.patch('/auth/update-account', data),
  listUsers: (params) => client.get('/auth/users', { params }),
  userCounts: () => client.get('/auth/users/counts'),
}

// Farmers
export const farmersApi = {
  list: (params) => client.get('/farmers', { params }),
  get: (id) => client.get(`/farmers/${id}`),
  create: (data) => client.post('/farmers', data),
  update: (id, data) => client.put(`/farmers/${id}`, data),
  remove: (id) => client.delete(`/farmers/${id}`),
  myProfile: () => client.get('/farmers/me'),
  updateMyProfile: (data) => client.put('/farmers/me', data),
}

// Peeler Groups
export const peelersApi = {
  list: (params) => client.get('/peeler-groups', { params }),
  get: (id) => client.get(`/peeler-groups/${id}`),
  create: (data) => client.post('/peeler-groups', data),
  update: (id, data) => client.put(`/peeler-groups/${id}`, data),
  updateAvailability: (id, data) => client.patch(`/peeler-groups/${id}/availability`, data),
  remove: (id) => client.delete(`/peeler-groups/${id}`),
  myGroup: () => client.get('/peeler-groups/me'),
  updateMyGroup: (data) => client.put('/peeler-groups/me', data),
}

// Harvest Requests
export const harvestApi = {
  list: (params) => client.get('/harvest-requests', { params }),
  get: (id) => client.get(`/harvest-requests/${id}`),
  create: (data) => client.post('/harvest-requests', data),
  update: (id, data) => client.put(`/harvest-requests/${id}`, data),
  updateStatus: (id, status) => client.patch(`/harvest-requests/${id}/status`, { status }),
  remove: (id) => client.delete(`/harvest-requests/${id}`),
}

// Notifications
export const notificationsApi = {
  list: () => client.get('/notifications'),
  markRead: (id) => client.patch(`/notifications/${id}/read`),
  markAllRead: () => client.patch('/notifications/read-all'),
  remove: (id) => client.delete(`/notifications/${id}`),
}

// Optimization
export const optimizationApi = {
  preview: (data) => client.post('/optimization/preview-payload', data),
  run: (data) => client.post('/optimization/run', data),
  schedules: () => client.get('/optimization/schedules'),
  schedule: (id) => client.get(`/optimization/schedules/${id}`),
}

// Optimizer direct
export const optimizerApi = {
  health: () => optimizerClient.get('/health'),
}
