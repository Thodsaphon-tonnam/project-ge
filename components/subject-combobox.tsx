'use client'

import {
  comboItemClass,
  comboListClass,
  comboPanelClass,
  comboSearchClass,
  comboTriggerClass,
} from '@/components/ui/combobox-styles'
import type { Subject } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function SubjectRow({
  code,
  name,
  year,
}: {
  code: string
  name: string
  year?: number
}) {
  return (
    <span className="grid min-w-0 flex-1 grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-3">
      <span className="truncate font-mono text-sm font-semibold tracking-wide text-primary md:text-xs">{code}</span>
      <span className="min-w-0 truncate text-foreground">{name}</span>
      {year != null && (
        <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground md:text-xs">ปี {year}</span>
      )}
    </span>
  )
}

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
        className={comboTriggerClass}
        data-combobox-trigger
      >
        {selected ? (
          <span className="min-w-0 flex-1">
            <SubjectRow code={selected.code} name={selected.name} />
          </span>
        ) : (
          <span className="truncate text-muted-foreground">เลือกหรือค้นหารหัสวิชา...</span>
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
              placeholder="พิมพ์รหัส เช่น CPE302 หรือชื่อวิชา"
              data-combobox-search
              className="h-9 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground md:h-8 md:text-sm"
            />
          </div>

          <ul className={comboListClass}>
            {filtered.length > 0 && (
              <li
                className="grid grid-cols-[7.5rem_minmax(0,1fr)_auto_1rem] items-center gap-3 px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
                aria-hidden
              >
                <span>รหัสวิชา</span>
                <span>ชื่อวิชา</span>
                <span>ชั้นปี</span>
                <span />
              </li>
            )}
            {filtered.map((s) => (
              <li key={s.code}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(s.code)
                    setQuery('')
                    setOpen(false)
                  }}
                  className={cn(
                    comboItemClass(value === s.code),
                    'grid grid-cols-[7.5rem_minmax(0,1fr)_auto_1rem] items-center gap-3',
                  )}
                  data-combobox-item
                >
                  <span className="truncate font-mono text-sm font-semibold tracking-wide text-primary md:text-xs">
                    {s.code}
                  </span>
                  <span className="min-w-0 truncate text-foreground">{s.name}</span>
                  <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground md:text-xs">
                    ปี {s.year}
                  </span>
                  <span className="flex size-4 items-center justify-center">
                    {value === s.code && <Check className="size-4 text-accent" />}
                  </span>
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
              className="mt-1 flex w-full items-center gap-2 rounded-lg bg-accent/10 px-3 py-2.5 text-left text-sm font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <Plus className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
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
