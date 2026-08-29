import { asCategory, toSubject, type CategoryId, type CpeDoc, type Subject } from '@/lib/data'
import { EXAM_FILES_BUCKET, isSupabaseConfigured, supabase } from '@/lib/supabase'

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

export async function fetchSubjects(): Promise<Subject[]> {
  requireSupabase()
  const { data, error } = await supabase.from('subjects').select('id, code, name').order('code')
  if (error) throw new VaultError(error.message)
  return (data ?? []).map(toSubject)
}

export async function fetchDocuments(): Promise<{ docs: CpeDoc[]; subjects: Subject[] }> {
  requireSupabase()
  const [docsResult, subjects] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, subject_id, category, term_year, file_url, uploader_name, status, created_at, subjects ( id, code, name )')
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    fetchSubjects(),
  ])

  if (docsResult.error) throw new VaultError(docsResult.error.message)

  const docs: CpeDoc[] = (docsResult.data ?? []).map((row) => {
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
    }
  })

  return { docs, subjects }
}

export async function createSubject(query: string): Promise<Subject> {
  requireSupabase()
  const trimmed = query.trim()
  const codeMatch = trimmed.match(/[A-Za-z]{2,}\d{3,}/)
  const code = (codeMatch?.[0] ?? trimmed).toUpperCase().replace(/\s+/g, '')
  const name = trimmed

  const existing = await supabase.from('subjects').select('id, code, name').eq('code', code).maybeSingle()
  if (existing.error) throw new VaultError(existing.error.message)
  if (existing.data) return toSubject(existing.data)

  const { data, error } = await supabase.from('subjects').insert({ code, name }).select('id, code, name').single()
  if (error) throw new VaultError(error.message)
  return toSubject(data)
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-ก-๙]+/g, '_').slice(0, 80) || 'file.pdf'
}

export async function uploadDocument(payload: {
  title: string
  subjectCode: string
  category: CategoryId
  term: string
  uploader: string
  file: File
  subjects: Subject[]
}): Promise<CpeDoc> {
  requireSupabase()

  let subject = payload.subjects.find((s) => s.code === payload.subjectCode)
  if (!subject) {
    subject = await createSubject(payload.subjectCode)
  }

  const path = `${subject.code}/${Date.now()}-${sanitizeFileName(payload.file.name)}`
  const { error: storageError } = await supabase.storage.from(EXAM_FILES_BUCKET).upload(path, payload.file, {
    contentType: payload.file.type || 'application/pdf',
    upsert: false,
  })
  if (storageError) throw new VaultError(storageError.message)

  const { data: publicUrlData } = supabase.storage.from(EXAM_FILES_BUCKET).getPublicUrl(path)
  const fileUrl = publicUrlData.publicUrl

  const { data, error } = await supabase
    .from('documents')
    .insert({
      title: payload.title,
      subject_id: subject.id,
      category: payload.category,
      term_year: payload.term,
      file_url: fileUrl,
      uploader_name: payload.uploader,
      status: 'approved',
    })
    .select('id, title, subject_id, category, term_year, file_url, uploader_name')
    .single()

  if (error) throw new VaultError(error.message)

  return {
    id: data.id,
    title: data.title,
    subjectId: data.subject_id,
    subjectCode: subject.code,
    category: asCategory(data.category),
    term: data.term_year,
    uploader: data.uploader_name || 'anonymous',
    fileUrl: data.file_url,
  }
}
