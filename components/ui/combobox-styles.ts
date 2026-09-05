import { cn } from '@/lib/utils'

export const comboTriggerClass =
  'flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-input bg-card px-3.5 py-2.5 text-left text-sm shadow-sm outline-none transition-colors hover:border-primary/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50'

export const comboPanelClass =
  'absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/10 ring-1 ring-black/5'

export const comboSearchClass =
  'flex items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-2'

export const comboListClass = 'mt-1 max-h-60 overflow-y-auto py-0.5'

export function comboItemClass(active?: boolean) {
  return cn(
    'w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
    'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
    active && 'bg-accent/10 hover:bg-accent/15',
  )
}
