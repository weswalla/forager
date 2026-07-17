'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Profile } from './types'
import { api } from './api'
import { clearStoredAuth, getStoredAuth, setStoredAuth } from './authStorage'

/**
 * API-key auth. The key is validated through api.signIn (mock mode accepts
 * anything non-empty) and the resulting profile is persisted alongside it.
 */
export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setProfile(getStoredAuth()?.profile ?? null)
    setHydrated(true)
  }, [])

  /** Returns the profile on success, null on failure (error state is set). */
  const signIn = useCallback(async (apiKey: string): Promise<Profile | null> => {
    setPending(true)
    setError(null)
    try {
      const p = await api.signIn(apiKey)
      setStoredAuth({ apiKey, profile: p })
      setProfile(p)
      return p
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
      return null
    } finally {
      setPending(false)
    }
  }, [])

  const signOut = useCallback(() => {
    clearStoredAuth()
    setProfile(null)
  }, [])

  return { profile, hydrated, pending, error, signIn, signOut }
}
