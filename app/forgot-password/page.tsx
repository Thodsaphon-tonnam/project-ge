'use client'

import { useAuth } from '@/components/auth-provider'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
      setInfo('ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึงสแปม)')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถส่งอีเมลได้')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">ลืมรหัสผ่าน</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          กรอกอีเมลที่ใช้สมัครสมาชิก ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">อีเมล</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={sent}
              className={inputClass}
            />
          </label>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          {info && <p className="text-sm font-medium text-accent">{info}</p>}

          <Button
            type="submit"
            size="lg"
            disabled={submitting || sent}
            className="w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
          >
            {submitting && <LoaderCircle className="size-4 animate-spin" />}
            {sent ? 'ส่งลิงก์แล้ว' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-accent hover:underline">
              กลับไปเข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}
