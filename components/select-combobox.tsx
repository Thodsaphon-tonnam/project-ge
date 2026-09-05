'use client'

import {
  comboItemClass,
  comboListClass,
  comboPanelClass,
  comboSearchClass,
  comboTriggerClass,
} from '@/components/ui/combobox-styles'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export type SelectOption = {
  value: string
  label: string
  keywords?: string
  content?: ReactNode
  trigger?: ReactNode
}

export function SelectCombobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  searchable = false,
  ariaLabel,
  icon,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder: string
  searchPlaceholder?: string
  searchable?: boolean
  ariaLabel?: string
  icon?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      options.filter((o) => {
        if (!q) return true
        const hay = `${o.label} ${o.keywords ?? ''} ${o.value}`.toLowerCase()
        return hay.includes(q)
      }),
    [options, q],
  )

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={ariaLabel}
        className={comboTriggerClass}
        data-combobox-trigger
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {icon}
          {selected ? (
            <span className="min-w-0 flex-1 overflow-hidden text-foreground">
              {selected.trigger ?? selected.label}
            </span>
          ) : (
            <span className="truncate text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className={comboPanelClass}>
          {searchable && (
            <div className={comboSearchClass}>
              <Search className="size-4 shrink-0 text-muted-foreground" />
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder ?? 'ค้นหา...'}
                data-combobox-search
                className="h-9 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground md:h-8 md:text-sm"
              />
            </div>
          )}

          <ul className={comboListClass}>
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={cn(comboItemClass(value === o.value), 'flex items-center gap-3')}
                  data-combobox-item
                >
                  <span className="min-w-0 flex-1">{o.content ?? o.label}</span>
                  {value === o.value && <Check className="size-4 shrink-0 text-accent" />}
                </button>
              </li>
            ))}

            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">ไม่พบรายการที่ค้นหา</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
