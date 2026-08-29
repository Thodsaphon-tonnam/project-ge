export type CategoryId = 'midterm' | 'final' | 'sheet' | 'lab'

export const CATEGORIES: { id: CategoryId; label: string; short: string }[] = [
  { id: 'midterm', label: 'ข้อสอบกลางภาค', short: 'ข้อสอบเก่า' },
  { id: 'final', label: 'ข้อสอบปลายภาค', short: 'ข้อสอบเก่า' },
  { id: 'sheet', label: 'ชีทสรุป', short: 'ชีทสรุป' },
  { id: 'lab', label: 'สรุปแลป', short: 'สรุปแลป' },
]

export const categoryLabel = (id: CategoryId) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id

export type Subject = {
  id: string
  code: string
  name: string
  nameEn: string
  year: 1 | 2 | 3 | 4
}

export type CpeDoc = {
  id: string
  title: string
  subjectId: string
  subjectCode: string
  category: CategoryId
  term: string
  uploader: string
  fileUrl: string
}

export function yearFromCode(code: string): 1 | 2 | 3 | 4 {
  const digit = code.match(/\d/)
  const n = digit ? Number(digit[0]) : 1
  if (n === 2 || n === 3 || n === 4) return n
  return 1
}

export function toSubject(row: { id: string; code: string; name: string }): Subject {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    nameEn: row.name,
    year: yearFromCode(row.code),
  }
}

export function asCategory(value: string): CategoryId {
  if (value === 'midterm' || value === 'final' || value === 'sheet' || value === 'lab') {
    return value
  }
  return 'sheet'
}
