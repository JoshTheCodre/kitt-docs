import { createClient } from "@supabase/supabase-js"
import { mockSupabase } from "./mock-supabase"

const supabaseAnonKey= 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtZmppZGp4ZG9mbWRvbml2enpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTg4NjIsImV4cCI6MjA2Nzc5NDg2Mn0.G7Owd_QPGV9l19F5tE4NIBRhnAleEImPa1_AraqFVn0'
const  supabaseUrl = 'https://vmfjidjxdofmdonivzzp.supabase.co'
// Use mock data if no Supabase credentials are provided
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : (mockSupabase as any)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          school: string
          department: string
          level: string
          role: "buyer" | "uploader"
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          school: string
          department: string
          level: string
          role?: "buyer" | "uploader"
        }
        Update: {
          name?: string
          school?: string
          department?: string
          level?: string
          role?: "buyer" | "uploader"
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          uploader_id: string
          department: string
          level: string
          price: number
          tags: string[]
          storage_path: string
          created_at: string
          description?: string
          file_type: string
        }
        Insert: {
          title: string
          uploader_id: string
          department: string
          level: string
          price: number
          tags: string[]
          storage_path: string
          description?: string
          file_type: string
        }
        Update: {
          title?: string
          department?: string
          level?: string
          price?: number
          tags?: string[]
          description?: string
        }
      }
      transactions: {
        Row: {
          id: string
          buyer_id: string
          resource_id: string
          amount: number
          timestamp: string
        }
        Insert: {
          buyer_id: string
          resource_id: string
          amount: number
        }
        Update: never
      }
      wallets: {
        Row: {
          user_id: string
          balance: number
        }
        Insert: {
          user_id: string
          balance?: number
        }
        Update: {
          balance: number
        }
      }
    }
  }
}
