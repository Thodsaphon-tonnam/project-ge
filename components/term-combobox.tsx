'use client'

import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

export function TermCombobox({
  options,
  value,
  onSelect,
  disabled,
}: {
  options: string[]
  value: string
  onSelect: (term: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

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
  const filtered = useMemo(
    () => options.filter((t) => t.toLowerCase().includes(q)),
    [options, q],
  )
  const exactMatch = options.some((t) => t.toLowerCase() === q)
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
        {value ? (
          <span className="truncate text-foreground">{value}</span>
        ) : (
          <span className="text-muted-foreground">เลือกหรือพิมพ์เทอม / ปีการศึกษา...</span>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  e.preventDefault()
                  onSelect(query.trim())
                  setQuery('')
                  setOpen(false)
                }
              }}
              placeholder="พิมพ์เช่น เทอม 1 / 2570"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(t)
                    setQuery('')
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="flex-1 truncate text-foreground">{t}</span>
                  {value === t && <Check className="size-4 shrink-0 text-accent" />}
                </button>
              </li>
            ))}

            {filtered.length === 0 && !showAddNew && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                ไม่พบเทอมที่ค้นหา
              </li>
            )}
          </ul>

          {showAddNew && (
            <button
              type="button"
              onClick={() => {
                onSelect(query.trim())
                setQuery('')
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 border-t border-border bg-accent/10 px-3 py-3 text-left text-sm font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <Plus className="size-4" />
              <span>
                เพิ่มเทอมใหม่:{' '}
                <span className="font-semibold text-foreground">{query.trim()}</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
