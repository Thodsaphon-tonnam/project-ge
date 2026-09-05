import { asCategory, asStatus, asYear, toSubject, type CategoryId, type CpeDoc, type Subject, type YearLevel } from '@/lib/data'
import { EXAM_FILES_BUCKET, isSupabaseConfigured, supabase } from '@/lib/supabase'

const DOCUMENT_SELECT =
  'id, title, subject_id, category, term_year, year, file_url, uploader_name, status, user_id, created_at, subjects ( id, code, name, year )'

export class VaultError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VaultError'
  }
}

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new VaultError(
      'ยังไม่ได้ตั้งค่า Supabase กรุณาใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local',
    )
  }
}

type DocumentRow = {
  id: string
  title: string
  subject_id: string
  category: string
  term_year: string
  year: number
  file_url: string
  uploader_name: string
  status: string
  subjects:
    | { id: string; code: string; name: string; year: number | null }
    | { id: string; code: string; name: string; year: number | null }[]
    | null
}

function mapDocument(row: DocumentRow): CpeDoc {
  const subject = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects
  return {
    id: row.id,
    title: row.title,
    subjectId: row.subject_id,
    subjectCode: subject?.code ?? '',
    category: asCategory(row.category),
    term: row.term_year,
    uploader: row.uploader_name || 'anonymous',
    fileUrl: row.file_url,
    year: asYear(row.year ?? subject?.year),
    status: asStatus(row.status),
  }
}

export async function fetchSubjects(): Promise<Subject[]> {
  requireSupabase()
  const { data, error } = await supabase.from('subjects').select('id, code, name, year').order('code')
  if (error) throw new VaultError(error.message)
  return (data ?? []).map(toSubject)
}

export async function fetchDocuments(): Promise<{ docs: CpeDoc[]; subjects: Subject[] }> {
  requireSupabase()
  const [docsResult, subjects] = await Promise.all([
    supabase.from('documents').select(DOCUMENT_SELECT).eq('status', 'approved').order('created_at', { ascending: false }),
    fetchSubjects(),
  ])

  if (docsResult.error) throw new VaultError(docsResult.error.message)
  return { docs: (docsResult.data ?? []).map(mapDocument), subjects }
}

export async function fetchAdminDocuments(): Promise<{ docs: CpeDoc[]; subjects: Subject[] }> {
  requireSupabase()
  const [docsResult, subjects] = await Promise.all([
    supabase.from('documents').select(DOCUMENT_SELECT).order('created_at', { ascending: false }),
    fetchSubjects(),
  ])

  if (docsResult.error) throw new VaultError(docsResult.error.message)
  return { docs: (docsResult.data ?? []).map(mapDocument), subjects }
}

export async function setDocumentStatus(id: string, status: CpeDoc['status']): Promise<void> {
  requireSupabase()
  const { error } = await supabase.from('documents').update({ status }).eq('id', id)
  if (error) throw new VaultError(error.message)
}

function storagePathFromPublicUrl(url: string) {
  const marker = `/object/public/${EXAM_FILES_BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  try {
    return decodeURIComponent(url.slice(i + marker.length))
  } catch {
    return url.slice(i + marker.length)
  }
}

export async function deleteDocument(doc: CpeDoc): Promise<void> {
  requireSupabase()
  const path = storagePathFromPublicUrl(doc.fileUrl)
  if (path) {
    await supabase.storage.from(EXAM_FILES_BUCKET).remove([path])
  }
  const { error } = await supabase.from('documents').delete().eq('id', doc.id)
  if (error) throw new VaultError(error.message)
}

export async function createSubject(query: string, year: YearLevel = 1): Promise<Subject> {
  requireSupabase()
  const trimmed = query.trim()
  const codeMatch = trimmed.match(/[A-Za-z]{2,}\d{3,}/)
  const code = (codeMatch?.[0] ?? trimmed).toUpperCase().replace(/\s+/g, '')
  const name = trimmed

  const existing = await supabase.from('subjects').select('id, code, name, year').eq('code', code).maybeSingle()
  if (existing.error) throw new VaultError(existing.error.message)
  if (existing.data) {
    if (existing.data.year !== year) {
      const { data: updated, error } = await supabase
        .from('subjects')
        .update({ year })
        .eq('id', existing.data.id)
        .select('id, code, name, year')
        .single()
      if (error) throw new VaultError(error.message)
      return toSubject(updated)
    }
    return toSubject(existing.data)
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({ code, name, year })
    .select('id, code, name, year')
    .single()
  if (error) throw new VaultError(error.message)
  return toSubject(data)
}

function randomStorageId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  }
  return Math.random().toString(36).slice(2, 12)
}

/** Supabase Storage keys must be ASCII; Thai names and spaces cause "Invalid key". */
function storageObjectKey(subjectCode: string) {
  const folder = subjectCode.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase() || 'files'
  return `${folder}/${Date.now()}-${randomStorageId()}.pdf`
}

export async function uploadDocument(payload: {
  title: string
  subjectCode: string
  category: CategoryId
  term: string
  year: YearLevel
  uploader: string
  file: File
  subjects: Subject[]
  userId?: string | null
  autoApprove?: boolean
}): Promise<CpeDoc> {
  requireSupabase()

  let subject = payload.subjects.find((s) => s.code === payload.subjectCode)
  if (!subject) {
    subject = await createSubject(payload.subjectCode, payload.year)
  } else if (subject.year !== payload.year) {
    const { data, error: yearError } = await supabase
      .from('subjects')
      .update({ year: payload.year })
      .eq('id', subject.id)
      .select('id, code, name, year')
      .single()
    if (yearError) throw new VaultError(yearError.message)
    subject = toSubject(data)
  }

  const path = storageObjectKey(subject.code)
  const { error: storageError } = await supabase.storage.from(EXAM_FILES_BUCKET).upload(path, payload.file, {
    contentType: payload.file.type || 'application/pdf',
    upsert: false,
  })
  if (storageError) throw new VaultError(storageError.message)

  const { data: publicUrlData } = supabase.storage.from(EXAM_FILES_BUCKET).getPublicUrl(path)
  const fileUrl = publicUrlData.publicUrl
  const status = payload.autoApprove ? 'approved' : 'pending'

  const { data, error } = await supabase
    .from('documents')
    .insert({
      title: payload.title,
      subject_id: subject.id,
      category: payload.category,
      term_year: payload.term,
      year: payload.year,
      file_url: fileUrl,
      uploader_name: payload.uploader,
      status,
      user_id: payload.userId ?? null,
    })
    .select(DOCUMENT_SELECT)
    .single()

  if (error) throw new VaultError(error.message)

  return mapDocument(data)
}
