'use client'

import { useAuth } from '@/components/auth-provider'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { LoaderCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function LoginForm() {
  const { signIn, signUp, user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace(next)
  }, [loading, user, next, router])

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
        const result = await signUp(email.trim(), password, displayName)
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
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === 'login'
            ? 'เข้าสู่ระบบเพื่ออัปโหลดเอกสารและแสดงความคิดเห็น'
            : 'สร้างบัญชีใหม่ด้วยอีเมลและรหัสผ่าน'}
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {mode === 'signup' && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">ชื่อที่แสดง</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น พี่ปีสาม"
                className={inputClass}
              />
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
      </main>
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
          <LoaderCircle className="size-8 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
