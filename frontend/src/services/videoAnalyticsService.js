import { authFetch, buildQueryString } from './apiClient'

export const videoAnalyticsService = {
  getViewGrowth(channelId, period = 'daily') {
    return authFetch(`/video-analytics/view-growth${buildQueryString({ channelId, period })}`)
  },

  getInteractions(channelId, type = 'view', params = {}) {
    return authFetch(
      `/video-analytics/interactions${buildQueryString({
        channelId,
        type,
        startDate: params.startDate,
        endDate: params.endDate
      })}`
    )
  },

  getOptimalPostingTime(channelId) {
    return authFetch(`/video-analytics/optimal-posting-time${buildQueryString({ channelId })}`)
  }
}

