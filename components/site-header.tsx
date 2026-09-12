'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { Boxes, ClipboardList, LogIn, LogOut, Plus, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function SiteHeader({ onUpload }: { onUpload?: () => void }) {
  const { user, profile, isAdmin, loading, signOut } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showAuth = mounted && !loading
  const showAdmin = showAuth && isAdmin

  function handleUpload() {
    if (!user) {
      router.push('/login?next=/')
      return
    }
    onUpload?.()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Boxes className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">CoE ส่งต่อ</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground"
            >
              คลังข้อสอบ
            </Link>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSc2jkPCmedkv7AEPj9hqpZgSStNLjbYYNXSNzz44TkyfFSMHg/viewform?pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground"
            >
              <ClipboardList className="size-4" />
              ประเมินผลเว็บไซต์
            </a>
            {showAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground"
              >
                <ShieldCheck className="size-4" />
                ตรวจสอบเอกสาร
              </Link>
            )}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {showAuth && user && (
            <span className="hidden max-w-36 truncate text-sm text-primary-foreground/80 sm:inline">
              {profile?.username ? `@${profile.username}` : user.email}
            </span>
          )}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSc2jkPCmedkv7AEPj9hqpZgSStNLjbYYNXSNzz44TkyfFSMHg/viewform?pli=1"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden"
            aria-label="ประเมินผลเว็บไซต์"
          >
            <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10">
              <ClipboardList className="size-4" />
            </Button>
          </a>
          {showAdmin && (
            <Link href="/admin" className="md:hidden">
              <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10">
                <ShieldCheck className="size-4" />
              </Button>
            </Link>
          )}
          {onUpload && (
            <Button
              size="lg"
              onClick={handleUpload}
              className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">อัปโหลดเอกสาร</span>
              <span className="sm:hidden">อัปโหลด</span>
            </Button>
          )}
          {showAuth &&
            (user ? (
              <Button
                size="lg"
                variant="ghost"
                onClick={() => void signOut()}
                className="text-primary-foreground hover:bg-white/10"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Button>
            ) : (
              <Link href="/login">
                <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10">
                  <LogIn className="size-4" />
                  เข้าสู่ระบบ
                </Button>
              </Link>
            ))}
        </div>
      </div>
    </header>
  )
}
