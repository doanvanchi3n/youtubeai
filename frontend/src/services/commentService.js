import { apiClient, buildQueryString } from './apiClient'

export const getCommentsBySentiment = async (channelId, sentiment, page = 0, size = 20) => {
  const params = buildQueryString({ channelId, sentiment, page, size })
  return apiClient.authFetch(`/comments/sentiment${params}`)
}

export const getCommentsByEmotion = async (channelId, emotion, page = 0, size = 20) => {
  const params = buildQueryString({ channelId, emotion, page, size })
  return apiClient.authFetch(`/comments/emotion${params}`)
}

export const getSentimentStats = async (channelId) => {
  const params = buildQueryString({ channelId })
  return apiClient.authFetch(`/comments/sentiment-stats${params}`)
}

export const getEmotionChartData = async (channelId) => {
  const params = buildQueryString({ channelId })
  return apiClient.authFetch(`/comments/emotion-chart${params}`)
}

export const getTopVideos = async (channelId, limit = 3) => {
  const params = buildQueryString({ channelId, limit })
  return apiClient.authFetch(`/comments/top-videos${params}`)
}

