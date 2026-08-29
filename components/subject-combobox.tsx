'use client'

import type { Subject } from '@/lib/data'
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function SubjectCombobox({
  subjects,
  value,
  onSelect,
  onAddNew,
  disabled,
}: {
  subjects: Subject[]
  value: string
  onSelect: (code: string) => void
  onAddNew: (query: string) => void | Promise<void>
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = subjects.find((s) => s.code === value)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = subjects.filter(
    (s) =>
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.nameEn ?? '').toLowerCase().includes(q),
  )
  const exactMatch = subjects.some((s) => s.code.toLowerCase() === q || s.name.toLowerCase() === q)
  const showAddNew = q.length > 0 && !exactMatch

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-xs font-semibold text-primary-foreground">
              {selected.code}
            </span>
            <span className="truncate text-foreground">{selected.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">เลือกหรือค้นหารหัสวิชา...</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted-foreground" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์รหัส เช่น CPE302 หรือชื่อวิชา"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.map((s) => (
              <li key={s.code}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(s.code)
                    setQuery('')
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="w-16 shrink-0 font-mono text-xs font-semibold text-primary">
                    {s.code}
                  </span>
                  <span className="flex-1 truncate text-foreground">{s.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">ปี {s.year}</span>
                  {value === s.code && <Check className="size-4 shrink-0 text-accent" />}
                </button>
              </li>
            ))}

            {filtered.length === 0 && !showAddNew && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                ไม่พบวิชาที่ค้นหา
              </li>
            )}
          </ul>

          {showAddNew && (
            <button
              type="button"
              onClick={() => {
                onAddNew(query.trim())
                setQuery('')
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 border-t border-border bg-accent/10 px-3 py-3 text-left text-sm font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <Plus className="size-4" />
              <span>
                เพิ่มวิชาใหม่:{' '}
                <span className="font-semibold text-foreground">{query.trim()}</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
