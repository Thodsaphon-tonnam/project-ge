'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { createComment, fetchComments } from '@/lib/comments'
import type { CpeDoc, DocComment } from '@/lib/data'
import { LoaderCircle, MessageSquare, Send, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function CommentModal({
  doc,
  onClose,
}: {
  doc: CpeDoc | null
  onClose: () => void
}) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<DocComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!doc) return
    setBody('')
    setError('')
    setLoading(true)
    void fetchComments(doc.id)
      .then(setComments)
      .catch((err) => setError(err instanceof Error ? err.message : 'โหลดความคิดเห็นไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [doc])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (doc) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [doc, onClose])

  if (!doc) return null

  async function handleSubmit() {
    if (!user || !doc) return
    setSending(true)
    setError('')
    try {
      const created = await createComment({
        documentId: doc.id,
        userId: user.id,
        authorName: profile?.displayName || user.email || 'anonymous',
        body,
      })
      setComments((prev) => [...prev, created])
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ส่งความคิดเห็นไม่สำเร็จ')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="comment-title" className="flex items-center gap-2 text-lg font-bold text-card-foreground">
              <MessageSquare className="size-5" />
              ความคิดเห็น
            </h2>
            <p className="truncate text-sm text-muted-foreground">{doc.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <LoaderCircle className="size-6 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความเห็นได้เลย</p>
          ) : (
            comments.map((c) => (
              <article key={c.id} className="rounded-xl border border-border bg-muted/40 px-3.5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{c.authorName}</p>
                  <time className="text-[11px] text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString('th-TH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{c.body}</p>
              </article>
            ))
          )}
        </div>

        <div className="border-t border-border px-5 py-4">
          {user ? (
            <div className="space-y-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="เขียนความคิดเห็นหรือติชมเอกสารนี้..."
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              />
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={() => void handleSubmit()}
                  disabled={sending || !body.trim()}
                  className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                  ส่งความคิดเห็น
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-accent hover:underline">
                เข้าสู่ระบบ
              </Link>{' '}
              เพื่อแสดงความคิดเห็น
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
