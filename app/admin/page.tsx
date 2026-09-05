'use client'

import { useAuth } from '@/components/auth-provider'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { categoryLabel, type CpeDoc, type DocumentStatus, type Subject } from '@/lib/data'
import { deleteDocument, fetchAdminDocuments, setDocumentStatus } from '@/lib/vault'
import { Check, Eye, FolderOpen, LoaderCircle, ShieldAlert, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type AdminTab = DocumentStatus

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'pending', label: 'รอตรวจสอบ' },
  { id: 'approved', label: 'อนุมัติแล้ว' },
  { id: 'rejected', label: 'ปฏิเสธแล้ว' },
]

export default function AdminPage() {
  const { loading: authLoading, isAdmin, user } = useAuth()
  const [docs, setDocs] = useState<CpeDoc[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tab, setTab] = useState<AdminTab>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { docs: nextDocs, subjects: nextSubjects } = await fetchAdminDocuments()
      setDocs(nextDocs)
      setSubjects(nextSubjects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดเอกสารไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && isAdmin) void refresh()
  }, [authLoading, isAdmin, refresh])

  const subjectMap = useMemo(() => {
    const m = new Map<string, Subject>()
    subjects.forEach((s) => m.set(s.code, s))
    return m
  }, [subjects])

  const filtered = docs.filter((d) => d.status === tab)
  const pendingCount = docs.filter((d) => d.status === 'pending').length

  async function handleStatus(doc: CpeDoc, status: DocumentStatus) {
    setBusyId(doc.id)
    setError('')
    try {
      await setDocumentStatus(doc.id, status)
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status } : d)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปเดตสถานะไม่สำเร็จ')
    } finally {
      setBusyId('')
    }
  }

  async function handleDelete(doc: CpeDoc) {
    if (!window.confirm(`ลบเอกสาร "${doc.title}" ออกจากระบบอย่างถาวร?`)) return
    setBusyId(doc.id)
    setError('')
    try {
      await deleteDocument(doc)
      setDocs((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ลบเอกสารไม่สำเร็จ')
    } finally {
      setBusyId('')
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-8 animate-spin" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-dvh bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <ShieldAlert className="mx-auto size-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-bold">สำหรับผู้ดูแลระบบเท่านั้น</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            บัญชีนี้ไม่มีสิทธิ์แอดมิน หากคุณเพิ่งตั้งค่า role ใน Supabase ให้ลองออกจากระบบแล้วเข้าใหม่
          </p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">
            กลับคลังข้อสอบ
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">ตรวจสอบเอกสาร</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          อนุมัติหรือปฏิเสธเอกสารที่รอตรวจสอบ และลบเอกสารออกจากระบบได้ทุกสถานะ
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {t.id === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-accent px-1.5 text-xs text-accent-foreground">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20 text-muted-foreground">
            <LoaderCircle className="size-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <FolderOpen className="size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">ไม่มีเอกสารในหมวดนี้</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {filtered.map((doc) => {
              const subject = subjectMap.get(doc.subjectCode)
              const busy = busyId === doc.id
              return (
                <li
                  key={doc.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-semibold text-primary-foreground">
                        {doc.subjectCode}
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">ปี {doc.year}</span>
                      <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs text-accent">
                        {categoryLabel(doc.category)}
                      </span>
                    </div>
                    <h2 className="mt-2 font-semibold">{doc.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {subject?.name ?? doc.subjectCode} · {doc.term} · แบ่งปันโดย {doc.uploader}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="lg">
                        <Eye className="size-4" />
                        ดูไฟล์
                      </Button>
                    </a>
                    {tab === 'pending' && (
                      <>
                        <Button
                          size="lg"
                          disabled={busy}
                          onClick={() => void handleStatus(doc, 'approved')}
                          className="bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                          อนุมัติ
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          disabled={busy}
                          onClick={() => void handleStatus(doc, 'rejected')}
                        >
                          <X className="size-4" />
                          ปฏิเสธ
                        </Button>
                      </>
                    )}
                    {tab === 'rejected' && (
                      <Button
                        size="lg"
                        disabled={busy}
                        onClick={() => void handleStatus(doc, 'approved')}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        อนุมัติ
                      </Button>
                    )}
                    <Button variant="destructive" size="lg" disabled={busy} onClick={() => void handleDelete(doc)}>
                      <Trash2 className="size-4" />
                      ลบ
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
