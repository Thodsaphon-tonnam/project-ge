'use client'

import { useAuth } from '@/components/auth-provider'
import { CommentModal } from '@/components/comment-modal'
import { DocumentCard } from '@/components/document-card'
import { FilterBar, type ChipId, type ViewId } from '@/components/filter-bar'
import { SiteHeader } from '@/components/site-header'
import { UploadModal, type UploadPayload } from '@/components/upload-modal'
import { type CpeDoc, type Subject } from '@/lib/data'
import { loadFavorites, saveFavorites } from '@/lib/favorites'
import { isSupabaseConfigured } from '@/lib/supabase'
import { createSubject, fetchDocuments, uploadDocument } from '@/lib/vault'
import { FolderOpen, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function Page() {
  const { user, profile, isAdmin } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [docs, setDocs] = useState<CpeDoc[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [year, setYear] = useState('all')
  const [subjectCode, setSubjectCode] = useState('all')
  const [chip, setChip] = useState<ChipId>('all')
  const [view, setView] = useState<ViewId>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [commentDoc, setCommentDoc] = useState<CpeDoc | null>(null)

  useEffect(() => {
    setFavorites(new Set(loadFavorites()))
  }, [])

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoadError(
        'ยังไม่ได้ตั้งค่า Supabase กรุณาคัดลอก .env.local.example เป็น .env.local แล้วใส่ URL กับ anon key',
      )
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      const { docs: nextDocs, subjects: nextSubjects } = await fetchDocuments()
      setDocs(nextDocs)
      setSubjects(nextSubjects)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'โหลดเอกสารไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const subjectMap = useMemo(() => {
    const m = new Map<string, Subject>()
    subjects.forEach((s) => m.set(s.code, s))
    return m
  }, [subjects])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter((d) => {
      const subject = subjectMap.get(d.subjectCode)
      if (view === 'favorites' && !favorites.has(d.id)) return false
      if (year !== 'all' && String(d.year) !== year) return false
      if (subjectCode !== 'all' && d.subjectCode !== subjectCode) return false
      if (chip === 'exam' && !(d.category === 'midterm' || d.category === 'final')) return false
      if (chip === 'sheet' && d.category !== 'sheet') return false
      if (chip === 'lab' && d.category !== 'lab') return false
      if (q) {
        const hay = `${d.title} ${d.subjectCode} ${subject?.name ?? ''} ${
          subject?.nameEn ?? ''
        }`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [docs, subjectMap, favorites, view, year, subjectCode, chip, search])

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveFavorites([...next])
      return next
    })
  }

  async function addSubject(query: string, yearLevel: Subject['year']): Promise<string> {
    const created = await createSubject(query, yearLevel)
    setSubjects((prev) => {
      const without = prev.filter((s) => s.id !== created.id)
      return [...without, created]
    })
    return created.code
  }

  async function handleUpload(payload: UploadPayload) {
    const newDoc = await uploadDocument({
      ...payload,
      subjects,
      userId: user?.id,
      autoApprove: isAdmin,
    })
    setSubjects((prev) => {
      const next = prev.map((s) =>
        s.code === newDoc.subjectCode ? { ...s, year: payload.year } : s,
      )
      if (next.some((s) => s.code === newDoc.subjectCode)) return next
      return [
        ...next,
        {
          id: newDoc.subjectId,
          code: newDoc.subjectCode,
          name: payload.subjectCode,
          nameEn: payload.subjectCode,
          year: payload.year,
        },
      ]
    })
    if (newDoc.status === 'approved') {
      setDocs((prev) => [newDoc, ...prev])
      setNotice('')
    } else {
      setNotice('ส่งเอกสารแล้ว รอแอดมินตรวจสอบก่อนจึงจะแสดงในคลัง')
    }
    setUploadOpen(false)
  }

  function handleYear(nextYear: string) {
    setYear(nextYear)
    setSubjectCode('all')
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader onUpload={() => setUploadOpen(true)} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="mb-8">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            คลังข้อสอบและชีทสรุป วิศวกรรมคอมพิวเตอร์
          </h1>
          <p className="mt-1.5 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            รวมข้อสอบเก่า ชีทสรุป และสรุปแลปจากรุ่นพี่ CoE ค้นหาด้วยรหัสวิชา
            แล้วดาวน์โหลดได้ทันที พร้อมบันทึกเอกสารที่ชอบไว้ในรายการโปรด
          </p>
        </section>

        <div className="mb-6">
          <FilterBar
            search={search}
            onSearch={setSearch}
            year={year}
            onYear={handleYear}
            subjectCode={subjectCode}
            onSubjectCode={setSubjectCode}
            subjects={subjects}
            chip={chip}
            onChip={setChip}
            view={view}
            onView={setView}
            favoriteCount={favorites.size}
          />
        </div>

        {loadError && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
            {notice}
          </div>
        )}

        <p className="mb-4 text-sm text-muted-foreground">
          พบ <span className="font-semibold text-foreground">{filtered.length}</span> เอกสาร
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <LoaderCircle className="size-8 animate-spin" />
            <p className="mt-3 text-sm">กำลังโหลดเอกสาร...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <DocumentCard
                key={d.id}
                doc={d}
                subject={subjectMap.get(d.subjectCode)}
                favorited={favorites.has(d.id)}
                onToggleFavorite={() => toggleFavorite(d.id)}
                onComment={() => setCommentDoc(d)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <FolderOpen className="size-7" />
            </span>
            <p className="mt-4 text-base font-medium text-foreground">
              {view === 'favorites' ? 'ยังไม่มีรายการโปรด' : 'ไม่พบเอกสารที่ค้นหา'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {view === 'favorites'
                ? 'กดไอคอนหัวใจบนเอกสารเพื่อบันทึกไว้ที่นี่'
                : 'ลองปรับคำค้นหาหรือตัวกรอง หรืออัปโหลดเอกสารใหม่'}
            </p>
          </div>
        )}
      </main>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        subjects={subjects}
        terms={docs.map((d) => d.term)}
        onAddSubject={addSubject}
        onSubmit={handleUpload}
        defaultUploader={profile?.displayName ?? ''}
      />

      <CommentModal doc={commentDoc} onClose={() => setCommentDoc(null)} />
    </div>
  )
}
