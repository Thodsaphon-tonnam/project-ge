export type Json = string | number | boolean | null | { [key: string]: Json | null } | Json[]

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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
