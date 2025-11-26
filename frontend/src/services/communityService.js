import { authFetch, buildQueryString } from './apiClient'

export const communityService = {
  /**
   * Get total comments count
   */
  async getTotalComments(channelId) {
    const query = buildQueryString({ channelId })
    const response = await authFetch(`/community/total-comments${query}`)
    return response?.totalComments ?? 0
  },

  /**
   * Get list of video topics
   */
  async getVideoTopics(channelId) {
    const query = buildQueryString({ channelId })
    const response = await authFetch(`/community/topics${query}`)
    return response || []
  },

  /**
   * Get sentiment distribution (for pie chart)
   */
  async getSentimentDistribution(channelId) {
    const query = buildQueryString({ channelId })
    const response = await authFetch(`/community/sentiment-distribution${query}`)
    return response || { sentiment: {}, emotion: {} }
  },

  /**
   * Get top keywords mentioned in comments
   */
  async getTopKeywords(channelId, limit = 10) {
    const query = buildQueryString({ channelId, limit })
    const response = await authFetch(`/community/keywords${query}`)
    return response || []
  },

  /**
   * Get topic suggestions
   */
  async getTopicSuggestions(channelId) {
    const query = buildQueryString({ channelId })
    const response = await authFetch(`/community/topic-suggestions${query}`)
    return response || []
  },

  /**
   * Get topic comparison data (for bar chart)
   */
  async getTopicComparison(channelId) {
    const query = buildQueryString({ channelId })
    const response = await authFetch(`/community/topic-comparison${query}`)
    return response || []
  }
}

