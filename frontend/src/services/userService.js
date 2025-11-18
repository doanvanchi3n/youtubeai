import { authFetch } from './apiClient'

export const userService = {
  getProfile() {
    return authFetch('/user/profile')
  },

  updateProfile(profile) {
    return authFetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    })
  },

  updatePassword(payload) {
    return authFetch('/user/password', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  },

  updatePreferences(preferences) {
    return authFetch('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    })
  },

  updateAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)

    return authFetch('/user/avatar', {
      method: 'POST',
      body: formData
    })
  }
}

