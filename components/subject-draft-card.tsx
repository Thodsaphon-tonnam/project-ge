'use client'

import { Button } from '@/components/ui/button'
import { normalizeSubjectCode } from '@/lib/data'
import { Pencil, Trash2 } from 'lucide-react'

export type SubjectDraft = {
  code: string
  name: string
}

export function SubjectDraftCard({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  draft: SubjectDraft
  onChange: (next: SubjectDraft) => void
  onSave: () => void
  onCancel: () => void
  saving?: boolean
}) {
  return (
    <div className="rounded-xl border border-accent/40 bg-accent/5 p-3.5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Pencil className="size-3.5 text-accent" />
            เพิ่มรายวิชาใหม่ 
          </p>
          
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="ลบวิชาที่กำลังเพิ่ม"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">รหัสวิชา</span>
          <input
            value={draft.code}
            onChange={(e) => onChange({ ...draft, code: e.target.value.toUpperCase() })}
            placeholder="เช่น CPE302"
            autoComplete="off"
            className={fieldClass}
          />
        </label>
        <label className="space-y-1 sm:col-span-1">
          <span className="text-xs font-medium text-muted-foreground">ชื่อวิชา</span>
          <input
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="เช่น Operating Systems"
            autoComplete="off"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={saving}>
          ยกเลิก
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onSave}
          disabled={saving || !normalizeSubjectCode(draft.code) || !draft.name.trim()}
          className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
        >
          บันทึก
        </Button>
      </div>
    </div>
  )
}

const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm'
