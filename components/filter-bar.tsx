'use client'

import { SelectCombobox } from '@/components/select-combobox'
import type { Subject } from '@/lib/data'
import { BookOpen, Heart, Layers, Search } from 'lucide-react'

export type ChipId = 'all' | 'exam' | 'sheet' | 'lab'
export type ViewId = 'all' | 'favorites'

const CHIPS: { id: ChipId; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'exam', label: 'ข้อสอบเก่า' },
  { id: 'sheet', label: 'ชีทสรุป' },
  { id: 'lab', label: 'สรุปแลป' },
]

export function FilterBar({
  search,
  onSearch,
  year,
  onYear,
  subjectCode,
  onSubjectCode,
  subjects,
  chip,
  onChip,
  view,
  onView,
  favoriteCount,
}: {
  search: string
  onSearch: (v: string) => void
  year: string
  onYear: (v: string) => void
  subjectCode: string
  onSubjectCode: (v: string) => void
  subjects: Subject[]
  chip: ChipId
  onChip: (v: ChipId) => void
  view: ViewId
  onView: (v: ViewId) => void
  favoriteCount: number
}) {
  const yearSubjects = subjects
    .filter((s) => year !== 'all' && String(s.year) === year)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'th'))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ค้นหารหัสวิชา (เช่น EN812303), ชื่อวิชา หรือชื่อเอกสาร..."
            className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </div>

        <SelectCombobox
          className="sm:w-48"
          value={year}
          onChange={onYear}
          ariaLabel="กรองตามชั้นปี"
          placeholder="เลือกชั้นปี"
          icon={<Layers className="size-4 shrink-0 text-muted-foreground" />}
          options={[
            { value: 'all', label: 'ทุกชั้นปี' },
            { value: '1', label: 'ปี 1' },
            { value: '2', label: 'ปี 2' },
            { value: '3', label: 'ปี 3' },
            { value: '4', label: 'ปี 4' },
          ]}
        />

        {year !== 'all' && (
          <SelectCombobox
            className="sm:min-w-80 sm:flex-1"
            value={subjectCode}
            onChange={onSubjectCode}
            ariaLabel="กรองตามชื่อวิชา"
            placeholder="เลือกวิชา"
            searchable
            searchPlaceholder="ค้นหารหัสหรือชื่อวิชา..."
            icon={<BookOpen className="size-4 shrink-0 text-muted-foreground" />}
            options={[
              { value: 'all', label: 'ทุกวิชา' },
              ...yearSubjects.map((s) => ({
                value: s.code,
                label: s.name,
                keywords: `${s.code} ${s.nameEn ?? ''}`,
                trigger: (
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 font-mono text-xs font-semibold tracking-wide text-primary">
                      {s.code}
                    </span>
                    <span className="min-w-0 truncate">{s.name}</span>
                  </span>
                ),
                content: (
                  <span className="grid min-w-0 w-full grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-3">
                    <span className="truncate font-mono text-xs font-semibold tracking-wide text-primary">
                      {s.code}
                    </span>
                    <span className="min-w-0 truncate text-foreground">{s.name}</span>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      ปี {s.year}
                    </span>
                  </span>
                ),
              })),
            ]}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChip(c.id)}
              aria-pressed={chip === c.id}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                chip === c.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
          <ToggleBtn active={view === 'all'} onClick={() => onView('all')}>
            ทั้งหมด
          </ToggleBtn>
          <ToggleBtn active={view === 'favorites'} onClick={() => onView('favorites')}>
            <Heart className={`size-3.5 ${view === 'favorites' ? 'fill-current' : ''}`} />
            รายการโปรด
            {favoriteCount > 0 && (
              <span
                className={`rounded-full px-1.5 text-xs ${
                  view === 'favorites'
                    ? 'bg-accent-foreground/20 text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {favoriteCount}
              </span>
            )}
          </ToggleBtn>
        </div>
      </div>
    </div>
  )
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-accent text-accent-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
