'use client'

import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  isUniqueViolation,
  isUsernameTaken,
  normalizeUsername,
  uniqueUsernameMessage,
  validateUsername,
} from '@/lib/username'
import type { User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Profile = {
  id: string
  email: string
  displayName: string
  username: string
  role: 'user' | 'admin'
}

type AuthContextValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  passwordRecovery: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<'session' | 'confirm'>
  saveUsername: (username: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const RECOVERY_FLAG = 'cpe-vault-password-recovery'

function isRecoveryUrl() {
  if (typeof window === 'undefined') return false
  const blob = `${window.location.hash}${window.location.search}`
  return /type=recovery/i.test(blob)
}

function readRecoveryFlag() {
  if (typeof window === 'undefined') return false
  if (isRecoveryUrl()) return true
  try {
    return sessionStorage.getItem(RECOVERY_FLAG) === '1'
  } catch {
    return false
  }
}

function writeRecoveryFlag(on: boolean) {
  try {
    if (on) sessionStorage.setItem(RECOVERY_FLAG, '1')
    else sessionStorage.removeItem(RECOVERY_FLAG)
  } catch {
    /* ignore */
  }
}

function mapProfile(row: {
  id: string
  email: string | null
  display_name: string
  username: string | null
  role: string
}): Profile {
  return {
    id: row.id,
    email: row.email ?? '',
    displayName: row.username || row.display_name || 'anonymous',
    username: row.username ?? '',
    role: row.role === 'admin' ? 'admin' : 'user',
  }
}

async function loadProfile(userId: string, attempts = 4): Promise<Profile | null> {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, username, role')
      .eq('id', userId)
      .maybeSingle()
    if (!error && data) return mapProfile(data)
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 350))
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  const markRecovery = useCallback((on: boolean) => {
    writeRecoveryFlag(on)
    setPasswordRecovery(on)
  }, [])

  useEffect(() => {
    if (readRecoveryFlag()) setPasswordRecovery(true)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }
    const next = await loadProfile(user.id)
    setProfile(next)
  }, [user])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let mounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') markRecovery(true)
      if (event === 'SIGNED_OUT') markRecovery(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    void loadProfile(user.id).then(setProfile)
  }, [user])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string, rawUsername: string) => {
    const username = normalizeUsername(rawUsername)
    const invalid = validateUsername(username)
    if (invalid) throw new Error(invalid)
    if (await isUsernameTaken(username)) throw new Error(uniqueUsernameMessage())

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: username } },
    })
    if (error) {
      if (isUniqueViolation(error) || /username|duplicate|unique/i.test(error.message)) {
        throw new Error(uniqueUsernameMessage())
      }
      throw error
    }
    return data.session ? 'session' : 'confirm'
  }, [])

  const saveUsername = useCallback(
    async (rawUsername: string) => {
      if (!user) throw new Error('กรุณาเข้าสู่ระบบ')
      const username = normalizeUsername(rawUsername)
      const invalid = validateUsername(username)
      if (invalid) throw new Error(invalid)
      if (await isUsernameTaken(username, user.id)) throw new Error(uniqueUsernameMessage())

      const { error } = await supabase
        .from('profiles')
        .update({ username, display_name: username })
        .eq('id', user.id)
      if (error) {
        if (isUniqueViolation(error)) throw new Error(uniqueUsernameMessage())
        throw error
      }
      const next = await loadProfile(user.id)
      setProfile(next)
    },
    [user],
  )

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    markRecovery(false)
  }, [markRecovery])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
    markRecovery(false)
  }, [markRecovery])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      passwordRecovery,
      signIn,
      signUp,
      saveUsername,
      requestPasswordReset,
      updatePassword,
      signOut,
      refreshProfile,
    }),
    [
      user,
      profile,
      loading,
      passwordRecovery,
      signIn,
      signUp,
      saveUsername,
      requestPasswordReset,
      updatePassword,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
