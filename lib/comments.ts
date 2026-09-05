import type { DocComment } from '@/lib/data'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { VaultError } from '@/lib/vault'

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new VaultError(
      'ยังไม่ได้ตั้งค่า Supabase กรุณาใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local',
    )
  }
}

export async function fetchComments(documentId: string): Promise<DocComment[]> {
  requireSupabase()
  const { data, error } = await supabase
    .from('comments')
    .select('id, document_id, user_id, author_name, body, created_at')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) throw new VaultError(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    documentId: row.document_id,
    userId: row.user_id,
    authorName: row.author_name || 'anonymous',
    body: row.body,
    createdAt: row.created_at,
  }))
}

export async function createComment(payload: {
  documentId: string
  userId: string
  authorName: string
  body: string
}): Promise<DocComment> {
  requireSupabase()
  const body = payload.body.trim()
  if (!body) throw new VaultError('กรุณาพิมพ์ความคิดเห็น')

  const { data, error } = await supabase
    .from('comments')
    .insert({
      document_id: payload.documentId,
      user_id: payload.userId,
      author_name: payload.authorName,
      body,
    })
    .select('id, document_id, user_id, author_name, body, created_at')
    .single()

  if (error) throw new VaultError(error.message)

  return {
    id: data.id,
    documentId: data.document_id,
    userId: data.user_id,
    authorName: data.author_name || 'anonymous',
    body: data.body,
    createdAt: data.created_at,
  }
}
