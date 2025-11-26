import { authFetch } from './apiClient'

export const aiService = {
  generateSuggestions(payload) {
    return authFetch('/ai/suggestions', {
      method: 'POST',
      body: payload
    })
  }
}


