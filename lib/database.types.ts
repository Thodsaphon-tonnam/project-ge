export type Json = string | number | boolean | null | { [key: string]: Json | null } | Json[]

export type UserRole = 'user' | 'admin'
export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export type Database = {
  public: {
    Tables: {
      subjects: {
        Row: {
          id: string
          code: string
          name: string
          year: number
        }
        Insert: {
          id?: string
          code: string
          name: string
          year?: number
        }
        Update: {
          id?: string
          code?: string
          name?: string
          year?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          title: string
          subject_id: string
          category: string
          term_year: string
          year: number
          file_url: string
          uploader_name: string
          status: string
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          subject_id: string
          category: string
          term_year: string
          year?: number
          file_url: string
          uploader_name?: string
          status?: string
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          subject_id?: string
          category?: string
          term_year?: string
          year?: number
          file_url?: string
          uploader_name?: string
          status?: string
          user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documents_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          document_id: string
          user_id: string | null
          author_name: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id?: string | null
          author_name?: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string | null
          author_name?: string
          body?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
