'use client'

import {
  comboItemClass,
  comboListClass,
  comboPanelClass,
  comboSearchClass,
  comboTriggerClass,
} from '@/components/ui/combobox-styles'
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

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
        className={comboTriggerClass}
        data-combobox-trigger
      >
        {value ? (
          <span className="min-w-0 flex-1 truncate text-foreground">{value}</span>
        ) : (
          <span className="truncate text-muted-foreground">เลือกหรือพิมพ์เทอม / ปีการศึกษา...</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className={comboPanelClass}>
          <div className={comboSearchClass}>
            <Search className="size-4 shrink-0 text-muted-foreground" />
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
              data-combobox-search
              className="h-9 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground md:h-8 md:text-sm"
            />
          </div>

          <ul className={comboListClass}>
            {filtered.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(t)
                    setQuery('')
                    setOpen(false)
                  }}
                  className={cn(comboItemClass(value === t), 'flex items-center gap-3')}
                  data-combobox-item
                >
                  <span className="min-w-0 flex-1 truncate text-foreground">{t}</span>
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
              className="mt-1 flex w-full items-center gap-2 rounded-lg bg-accent/10 px-3 py-2.5 text-left text-sm font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <Plus className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
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
