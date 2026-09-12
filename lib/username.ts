import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export const USERNAME_MIN = 3
export const USERNAME_MAX = 24

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g

export function sanitizeUsernameInput(raw: string) {
  return raw.replace(CONTROL_CHARS, '').replace(/^\s+/, '').replace(/\s+/g, ' ')
}

export function normalizeUsername(raw: string) {
  return sanitizeUsernameInput(raw).trim()
}

export function validateUsername(raw: string): string | null {
  const username = normalizeUsername(raw)
  if (!username) return 'กรุณาตั้ง Username'
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `Username ต้องมี ${USERNAME_MIN}–${USERNAME_MAX} ตัวอักษร`
  }
  return null
}

export function formatUploaderName(username: string | null | undefined) {
  const value = (username ?? '').trim()
  if (!value || value === 'anonymous') return 'ไม่ระบุตัวตน'
  return value.startsWith('@') ? value : `@${value}`
}

export function isUniqueViolation(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  if (error.code === '23505') return true
  const msg = (error.message ?? '').toLowerCase()
  return msg.includes('duplicate') || msg.includes('unique') || msg.includes('already exists')
}

export async function isUsernameTaken(username: string, excludeUserId?: string | null) {
  if (!isSupabaseConfigured) return false
  const uname = normalizeUsername(username)
  const { data, error } = await supabase.rpc('username_taken', {
    uname,
    exclude_id: excludeUserId ?? undefined,
  })
  if (error) throw error
  return Boolean(data)
}

export function uniqueUsernameMessage() {
  return 'Username นี้ถูกใช้แล้ว กรุณาเลือกชื่ออื่น'
}

export const USERNAME_HINT = `ไม่ซ้ำในระบบ · ${USERNAME_MIN}–${USERNAME_MAX} ตัวอักษร ใช้ภาษาไทย อังกฤษ เว้นวรรค และอักขระพิเศษได้`
