'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import {
  normalizeUsername,
  uniqueUsernameMessage,
  USERNAME_HINT,
  USERNAME_MAX,
  USERNAME_MIN,
  validateUsername,
} from '@/lib/username'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'

export function UsernameGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, saveUsername } = useAuth()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const needsUsername = Boolean(user && profile && !profile.username)

  if (loading || !needsUsername) return children

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const invalid = validateUsername(username)
    if (invalid) {
      setError(invalid)
      return
    }
    setSaving(true)
    try {
      await saveUsername(username)
    } catch (err) {
      setError(err instanceof Error ? err.message : uniqueUsernameMessage())
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="w-full max-w-md rounded-t-2xl border border-border bg-card p-6 shadow-xl sm:rounded-2xl"
        >
          <h2 className="text-lg font-bold text-card-foreground">ตั้ง Username</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            บัญชีของคุณต้องมี Username ที่ไม่ซ้ำในระบบ ชื่อนี้จะแสดงเป็นผู้แบ่งปันเอกสารโดยอัตโนมัติ
            และไม่สามารถใช้ชื่อของคนอื่นได้
          </p>
          <label className="mt-5 block space-y-1.5">
            <span className="text-sm font-medium">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(normalizeUsername(e.target.value))}
              required
              minLength={USERNAME_MIN}
              maxLength={USERNAME_MAX}
              autoComplete="username"
              placeholder="เช่น พี่ปีสาม หรือ CoE_senior!"
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm"
            />
            <span className="block text-xs text-muted-foreground">
              {USERNAME_HINT}
            </span>
          </label>
          {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
          <Button
            type="submit"
            size="lg"
            disabled={saving}
            className="mt-5 w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
          >
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            บันทึก Username
          </Button>
        </form>
      </div>
    </>
  )
}
