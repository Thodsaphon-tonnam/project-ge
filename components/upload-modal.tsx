'use client'

import { Button } from '@/components/ui/button'
import { CATEGORIES, YEAR_LEVELS, type CategoryId, type Subject, type YearLevel } from '@/lib/data'
import { CloudUpload, FileText, LoaderCircle, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SubjectCombobox } from '@/components/subject-combobox'
import { TermCombobox } from '@/components/term-combobox'

export const DEFAULT_TERMS = [
  'เทอม 1 / 2569',
  'เทอม 2 / 2569',
  'เทอม 1 / 2568',
  'เทอม 2 / 2568',
  'เทอม 1 / 2567',
  'เทอม 2 / 2567',
]

const MAX_FILE_BYTES = 50 * 1024 * 1024

export type UploadPayload = {
  title: string
  subjectCode: string
  category: CategoryId
  term: string
  year: YearLevel
  uploader: string
  file: File
}

export function UploadModal({
  open,
  onClose,
  subjects,
  onAddSubject,
  onSubmit,
  terms = DEFAULT_TERMS,
  defaultUploader = '',
}: {
  open: boolean
  onClose: () => void
  subjects: Subject[]
  onAddSubject: (query: string, year: YearLevel) => Promise<string>
  onSubmit: (payload: UploadPayload) => Promise<void>
  terms?: string[]
  defaultUploader?: string
}) {
  const [title, setTitle] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [category, setCategory] = useState<CategoryId>('sheet')
  const [term, setTerm] = useState('')
  const [customTerms, setCustomTerms] = useState<string[]>([])
  const [year, setYear] = useState<YearLevel>(1)
  const [uploader, setUploader] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [addingSubject, setAddingSubject] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setSubjectCode('')
      setCategory('sheet')
      setTerm('')
      setCustomTerms([])
      setYear(1)
      setUploader(defaultUploader)
      setFile(null)
      setError('')
      setSubmitting(false)
    }
  }, [open, defaultUploader])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, submitting])

  if (!open) return null

  function pickFile(files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('กรุณาเลือกไฟล์ PDF เท่านั้น')
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setError('ไฟล์มีขนาดเกิน 50MB')
      return
    }
    setError('')
    setFile(f)
  }

  async function handleAddSubject(query: string) {
    setAddingSubject(true)
    setError('')
    try {
      const code = await onAddSubject(query, year)
      setSubjectCode(code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เพิ่มวิชาไม่สำเร็จ')
    } finally {
      setAddingSubject(false)
    }
  }

  async function handleSubmit() {
    if (!file) return setError('กรุณาเลือกไฟล์ PDF ก่อน')
    if (!title.trim()) return setError('กรุณาตั้งชื่อเอกสาร')
    if (!subjectCode) return setError('กรุณาเลือกวิชา')
    if (!term.trim()) return setError('กรุณาเลือกหรือพิมพ์เทอม / ปีการศึกษา')
    setError('')
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        subjectCode,
        category,
        term: term.trim(),
        year,
        uploader: uploader.trim() || 'anonymous',
        file,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="upload-title" className="text-lg font-bold text-card-foreground">
              อัปโหลดเอกสาร
            </h2>
            <p className="text-sm text-muted-foreground">เอกสารจะแสดงในคลังหลังจากแอดมินอนุมัติ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="ปิด"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pickFile(e.dataTransfer.files)
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              dragging
                ? 'border-accent bg-accent/10'
                : file
                  ? 'border-accent/50 bg-accent/5'
                  : 'border-border bg-muted/40 hover:border-accent/50 hover:bg-accent/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files)}
            />
            {file ? (
              <>
                <span className="flex size-11 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <FileText className="size-6" />
                </span>
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">คลิกเพื่อเปลี่ยนไฟล์</p>
              </>
            ) : (
              <>
                <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <CloudUpload className="size-6" />
                </span>
                <p className="text-sm font-medium text-foreground">
                  ลากไฟล์ PDF มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์
                </p>
                <p className="text-xs text-muted-foreground">รองรับไฟล์ .pdf ขนาดไม่เกิน 50MB</p>
              </>
            )}
          </div>

          <Field label="ชื่อเอกสาร">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ตั้งชื่อเอกสาร เช่น สรุป OS บทที่ 1-4"
              className={inputClass}
            />
          </Field>

          <Field label="วิชา">
            <SubjectCombobox
              subjects={subjects}
              value={subjectCode}
              onSelect={(code) => {
                setSubjectCode(code)
                const selected = subjects.find((s) => s.code === code)
                if (selected) setYear(selected.year)
              }}
              onAddNew={handleAddSubject}
              disabled={addingSubject}
            />
          </Field>

          <Field label="ชั้นปี">
            <div className="grid grid-cols-4 gap-2">
              {YEAR_LEVELS.map((y) => (
                <button
                  key={y.id}
                  type="button"
                  onClick={() => setYear(y.id)}
                  aria-pressed={year === y.id}
                  className={`h-11 rounded-lg border text-sm font-medium transition-colors ${
                    year === y.id
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-input text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {y.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="ประเภทเอกสาร">
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    category === c.id
                      ? 'border-accent bg-accent/10 font-medium text-foreground'
                      : 'border-input hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={category === c.id}
                    onChange={() => setCategory(c.id)}
                    className="sr-only"
                  />
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      category === c.id ? 'border-accent' : 'border-muted-foreground/50'
                    }`}
                  >
                    {category === c.id && <span className="size-2 rounded-full bg-accent" />}
                  </span>
                  {c.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label="เทอม / ปีการศึกษา">
            <TermCombobox
              options={[...new Set([...DEFAULT_TERMS, ...terms, ...customTerms])]}
              value={term}
              onSelect={(next) => {
                setTerm(next)
                setCustomTerms((prev) => (prev.includes(next) ? prev : [...prev, next]))
              }}
            />
          </Field>

          <Field label="ชื่อผู้แบ่งปัน / นามแฝง (ไม่บังคับ)">
            <input
              value={uploader}
              onChange={(e) => setUploader(e.target.value)}
              placeholder="เช่น พี่ปีสาม หรือเว้นว่างเพื่อไม่ระบุตัวตน"
              className={inputClass}
            />
          </Field>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" size="lg" onClick={onClose} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
          >
            {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {submitting ? 'กำลังอัปโหลด...' : 'บันทึกและอัปโหลด'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}
