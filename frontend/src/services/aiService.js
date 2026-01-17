import { authFetch } from './apiClient'

export const aiService = {
  generateSuggestions(payload) {
    return authFetch('/ai/suggestions', {
      method: 'POST',
      body: payload
    })
  },

  chat(messages, context) {
    return authFetch('/ai/chat', {
      method: 'POST',
      body: { messages, context }
    })
  }
}


