import { authFetch, buildQueryString } from './apiClient'

export const dashboardService = {
  analyzeUrl(url) {
    return authFetch('/youtube/analyze', {
      method: 'POST',
      body: { url }
    })
  },

  getMetrics(channelId) {
    return authFetch(`/dashboard/metrics${buildQueryString({ channelId })}`)
  },

  getTrends(channelId, params = {}) {
    return authFetch(
      `/dashboard/trends${buildQueryString({
        channelId,
        startDate: params.startDate,
        endDate: params.endDate
      })}`
    )
  },

  getTopVideos(channelId, limit = 5) {
    return authFetch(`/dashboard/top-videos${buildQueryString({ channelId, limit })}`)
  },

  getSentiment(channelId) {
    return authFetch(`/dashboard/sentiment${buildQueryString({ channelId })}`)
  }
}


