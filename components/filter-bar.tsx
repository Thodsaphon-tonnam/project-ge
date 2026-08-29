'use client'

import { Heart, Layers, Search } from 'lucide-react'

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
  chip: ChipId
  onChip: (v: ChipId) => void
  view: ViewId
  onView: (v: ViewId) => void
  favoriteCount: number
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ค้นหารหัสวิชา (เช่น CPE302), ชื่อวิชา หรือชื่อเอกสาร..."
            className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </div>

        <div className="relative sm:w-56">
          <Layers className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={year}
            onChange={(e) => onYear(e.target.value)}
            aria-label="กรองตามชั้นปี"
            className="h-12 w-full appearance-none rounded-xl border border-input bg-card pl-10 pr-8 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <option value="all">ทุกชั้นปี</option>
            <option value="1">ปี 1</option>
            <option value="2">ปี 2</option>
            <option value="3">ปี 3</option>
            <option value="4">ปี 4</option>
          </select>
        </div>
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
