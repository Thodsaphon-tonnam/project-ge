export type CategoryId = 'midterm' | 'final' | 'sheet' | 'lab'

export const CATEGORIES: { id: CategoryId; label: string; short: string }[] = [
  { id: 'midterm', label: 'ข้อสอบกลางภาค', short: 'ข้อสอบเก่า' },
  { id: 'final', label: 'ข้อสอบปลายภาค', short: 'ข้อสอบเก่า' },
  { id: 'sheet', label: 'ชีทสรุป', short: 'ชีทสรุป' },
  { id: 'lab', label: 'สรุปแลป', short: 'สรุปแลป' },
]

export const categoryLabel = (id: CategoryId) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id

export type YearLevel = 1 | 2 | 3 | 4

export type Subject = {
  id: string
  code: string
  name: string
  nameEn: string
  year: YearLevel
}

export const YEAR_LEVELS: { id: YearLevel; label: string }[] = [
  { id: 1, label: 'ปี 1' },
  { id: 2, label: 'ปี 2' },
  { id: 3, label: 'ปี 3' },
  { id: 4, label: 'ปี 4' },
]

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export type CpeDoc = {
  id: string
  title: string
  subjectId: string
  subjectCode: string
  category: CategoryId
  term: string
  uploader: string
  uploaderId: string | null
  fileUrl: string
  year: YearLevel
  status: DocumentStatus
}

export type DocComment = {
  id: string
  documentId: string
  userId: string | null
  authorName: string
  body: string
  createdAt: string
}

export function asStatus(value: string | null | undefined): DocumentStatus {
  if (value === 'pending' || value === 'rejected') return value
  return 'approved'
}

export function parseSubjectInput(query: string): { code: string; name: string } {
  const trimmed = query.trim().replace(/\s+/g, ' ')
  const codeMatch = trimmed.match(/[A-Za-z]{2,}\d{3,}/)
  const code = (codeMatch?.[0] ?? trimmed).toUpperCase().replace(/\s+/g, '')
  const nameFromRest = codeMatch
    ? trimmed.replace(codeMatch[0], ' ').replace(/\s+/g, ' ').trim()
    : ''
  return {
    code,
    name: nameFromRest || trimmed,
  }
}

export function normalizeSubjectCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

export function asYear(value: number | string | null | undefined): YearLevel {
  const n = Number(value)
  if (n === 2 || n === 3 || n === 4) return n
  return 1
}

export function toSubject(row: { id: string; code: string; name: string; year?: number | null }): Subject {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    nameEn: row.name,
    year: asYear(row.year),
  }
}

export function asCategory(value: string): CategoryId {
  if (value === 'midterm' || value === 'final' || value === 'sheet' || value === 'lab') {
    return value
  }
  return 'sheet'
}
