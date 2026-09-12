'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import {
  sanitizeUsernameInput,
  USERNAME_HINT,
  USERNAME_MAX,
  USERNAME_MIN,
  validateUsername,
} from '@/lib/username'
import { LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm'

export function LoginForm() {
  const { signIn, signUp, user, loading, passwordRecovery } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (passwordRecovery) {
      router.replace('/update-password')
      return
    }
    if (user) router.replace(next)
  }, [loading, user, next, router, passwordRecovery])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
        router.replace(next)
      } else {
        const invalid = validateUsername(username)
        if (invalid) throw new Error(invalid)
        const result = await signUp(email.trim(), password, username)
        if (result === 'confirm') {
          setInfo('สมัครสำเร็จ กรุณายืนยันอีเมลแล้วกลับมาเข้าสู่ระบบ')
          setMode('login')
        } else {
          router.replace(next)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {mode === 'login'
          ? 'เข้าสู่ระบบเพื่ออัปโหลดเอกสารและแสดงความคิดเห็น'
          : 'สร้างบัญชีใหม่ด้วยอีเมล Username ที่ไม่ซ้ำ และรหัสผ่าน'}
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {mode === 'signup' && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
              required
              minLength={USERNAME_MIN}
              maxLength={USERNAME_MAX}
              autoComplete="username"
              placeholder="เช่น พี่ ปีสาม หรือ CoE senior"
              className={inputClass}
            />
            <span className="block text-xs text-muted-foreground">{USERNAME_HINT}</span>
          </label>
        )}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">อีเมล</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">รหัสผ่าน</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            className={inputClass}
          />
          {mode === 'login' && (
            <span className="block text-right">
              <Link href="/forgot-password" className="text-xs font-medium text-accent hover:underline">
                ลืมรหัสผ่าน?
              </Link>
            </span>
          )}
        </label>

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        {info && <p className="text-sm font-medium text-accent">{info}</p>}

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
        >
          {submitting && <LoaderCircle className="size-4 animate-spin" />}
          {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
              setInfo('')
            }}
            className="font-medium text-accent hover:underline"
          >
            {mode === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </p>
      </form>
    </>
  )
}
