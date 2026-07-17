import type { Profile } from './types'

const AUTH_KEY = 'forager.auth'

export interface StoredAuth {
  apiKey: string
  profile: Profile
}

export function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.apiKey || !parsed?.profile?.handle) return null
    return parsed as StoredAuth
  } catch {
    return null
  }
}

export function setStoredAuth(auth: StoredAuth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_KEY)
}
