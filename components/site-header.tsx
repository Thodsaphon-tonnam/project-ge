'use client'

import { Button } from '@/components/ui/button'
import { Boxes, Plus } from 'lucide-react'

export function SiteHeader({ onUpload }: { onUpload: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Boxes className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">CPE Vault</span>
          </a>
          <nav className="hidden md:flex">
            <a
              href="/"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground"
            >
              คลังข้อสอบ
            </a>
          </nav>
        </div>

        <Button
          size="lg"
          onClick={onUpload}
          className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="size-4" />
          อัปโหลดเอกสาร
        </Button>
      </div>
    </header>
  )
}
