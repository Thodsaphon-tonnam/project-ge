'use client'

import { useAuth } from '@/components/auth-provider'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm'

export default function UpdatePasswordPage() {
  const { user, loading, passwordRecovery, updatePassword } = useAuth()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const waitingForLink = loading || (passwordRecovery && !user)
  const canReset = Boolean(user)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (password !== confirm) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    setSubmitting(true)
    try {
      await updatePassword(password)
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถตั้งรหัสผ่านใหม่ได้')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">ตั้งรหัสผ่านใหม่</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {waitingForLink
            ? 'กำลังตรวจสอบลิงก์รีเซ็ต...'
            : canReset
              ? 'กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ'
              : 'ลิงก์รีเซ็ตหมดอายุหรือยังไม่ได้เปิดจากอีเมล กรุณาขอลิงก์ใหม่'}
        </p>

        {waitingForLink ? (
          <div className="mt-10 flex justify-center text-muted-foreground">
            <LoaderCircle className="size-8 animate-spin" />
          </div>
        ) : canReset ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">รหัสผ่านใหม่</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                autoComplete="new-password"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">ยืนยันรหัสผ่านใหม่</span>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                autoComplete="new-password"
                className={inputClass}
              />
            </label>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            >
              {submitting && <LoaderCircle className="size-4 animate-spin" />}
              บันทึกรหัสผ่านใหม่
            </Button>
          </form>
        ) : (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="font-medium text-accent hover:underline">
              ขอลิงก์รีเซ็ตรหัสผ่านอีกครั้ง
            </Link>
          </p>
        )}
      </main>
    </div>
  )
}
