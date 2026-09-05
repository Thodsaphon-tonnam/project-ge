'use client'

import { buttonVariants } from '@/components/ui/button'
import { categoryLabel, type CpeDoc, type Subject } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Download, Eye, Heart, MessageSquare } from 'lucide-react'

export function DocumentCard({
  doc,
  subject,
  favorited,
  onToggleFavorite,
  onComment,
}: {
  doc: CpeDoc
  subject: Subject | undefined
  favorited: boolean
  onToggleFavorite: () => void
  onComment: () => void
}) {
  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <span className="inline-flex max-w-full justify-self-start truncate rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-semibold tracking-wide text-primary-foreground">
            {doc.subjectCode}
          </span>
          <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <span className="whitespace-nowrap rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              ปี {doc.year}
            </span>
            <span className="whitespace-nowrap rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {categoryLabel(doc.category)}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={favorited}
          aria-label={favorited ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
          className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Heart
            className={`size-5 transition-all ${favorited ? 'fill-destructive text-destructive' : ''}`}
          />
        </button>
      </div>

      <h3 className="mt-3 text-pretty text-base font-semibold leading-snug text-card-foreground">
        {doc.title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {subject ? `${subject.name}${subject.nameEn && subject.nameEn !== subject.name ? ` (${subject.nameEn})` : ''}` : doc.subjectCode}
      </p>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="truncate">{doc.term}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <a
          href={doc.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'flex-1')}
        >
          <Eye className="size-4" />
          ดูตัวอย่าง
        </a>
        <a
          href={doc.fileUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'flex-1 bg-accent font-semibold text-accent-foreground hover:bg-accent/90',
          )}
        >
          <Download className="size-4" />
          ดาวน์โหลด PDF
        </a>
      </div>

      <button
        type="button"
        onClick={onComment}
        className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MessageSquare className="size-4" />
        ความคิดเห็น
      </button>

      <p className="mt-1 truncate text-center text-[11px] text-muted-foreground">
        แบ่งปันโดย {doc.uploader}
      </p>
    </article>
  )
}
