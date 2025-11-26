import { apiClient, buildQueryString } from './apiClient'

const getDashboardStats = () => apiClient.authFetch('/admin/dashboard')
const getServerStatus = () => apiClient.authFetch('/admin/server-status')
const getApiRequestStats = (params = {}) =>
  apiClient.authFetch(`/admin/dashboard/api-requests${buildQueryString(params)}`)
const getRecentActivities = (params = {}) =>
  apiClient.authFetch(`/admin/dashboard/activity${buildQueryString(params)}`)
const getRecentLogs = (params = {}) =>
  apiClient.authFetch(`/admin/dashboard/logs${buildQueryString(params)}`)
const getAiModels = () => apiClient.authFetch('/admin/ai/models')
const uploadAiModel = (payload) =>
  apiClient.authFetch('/admin/ai/models/upload', {
    method: 'POST',
    body: payload,
  })
const activateAiModel = (id) =>
  apiClient.authFetch(`/admin/ai/models/${id}/activate`, { method: 'PUT' })
const getTrainingHistory = (params = {}) =>
  apiClient.authFetch(`/admin/ai/training-history${buildQueryString(params)}`)
const getAnalysisHistory = (params = {}) =>
  apiClient.authFetch(`/admin/data/analysis-history${buildQueryString(params)}`)
const refreshChannelData = (id) =>
  apiClient.authFetch(`/admin/data/channels/${id}/refresh`, { method: 'POST' })
const deleteChannel = (id) =>
  apiClient.authFetch(`/admin/data/channels/${id}`, { method: 'DELETE' })
const getSupportTickets = (params = {}) =>
  apiClient.authFetch(`/admin/support/tickets${buildQueryString(params)}`)
const respondToTicket = (id, payload) =>
  apiClient.authFetch(`/admin/support/tickets/${id}/respond`, {
    method: 'PUT',
    body: payload,
  })
const getSystemLogs = (params = {}) =>
  apiClient.authFetch(`/admin/logs${buildQueryString(params)}`)
const getUsers = (params = {}) =>
  apiClient.authFetch(`/admin/users${buildQueryString(params)}`)
const getUserDetail = (id) => apiClient.authFetch(`/admin/users/${id}`)
const updateUser = (id, payload) =>
  apiClient.authFetch(`/admin/users/${id}`, {
    method: 'PUT',
    body: payload,
  })
const updateUserRole = (id, role) =>
  apiClient.authFetch(`/admin/users/${id}/role`, {
    method: 'PUT',
    body: { role },
  })
const lockUser = (id) => apiClient.authFetch(`/admin/users/${id}/lock`, { method: 'PUT' })
const unlockUser = (id) => apiClient.authFetch(`/admin/users/${id}/unlock`, { method: 'PUT' })
const deleteUser = (id) => apiClient.authFetch(`/admin/users/${id}`, { method: 'DELETE' })

const getSystemSettings = () => apiClient.authFetch('/admin/settings')
const updateSystemSettings = (payload) =>
  apiClient.authFetch('/admin/settings', {
    method: 'PUT',
    body: payload,
  })

export const adminService = {
  getDashboardStats,
  getServerStatus,
  getApiRequestStats,
  getRecentActivities,
  getRecentLogs,
  getAiModels,
  uploadAiModel,
  activateAiModel,
  getTrainingHistory,
  getAnalysisHistory,
  refreshChannelData,
  deleteChannel,
  getSupportTickets,
  respondToTicket,
  getSystemLogs,
  getSystemSettings,
  updateSystemSettings,
  getUsers,
  getUserDetail,
  updateUser,
  updateUserRole,
  lockUser,
  unlockUser,
  deleteUser,
}

export default adminService

