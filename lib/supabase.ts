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
          image: string | null
          school: string
          department: string
          level: string
          role: "buyer" | "uploader" | "admin"
          created_at: string
          updated_at: string
          is_verified: boolean
          total_earnings: number
          total_spent: number
        }
        Insert: {
          id: string
          name: string
          email: string
          image?: string | null
          school: string
          department: string
          level: string
          role?: "buyer" | "uploader" | "admin"
        }
        Update: {
          name?: string
          image?: string | null
          school?: string
          department?: string
          level?: string
          role?: "buyer" | "uploader" | "admin"
          is_verified?: boolean
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          uploader_id: string
          department: string
          level: string
          price: number
          tags: string[]
          file_type: string
          file_size: number | null
          storage_path: string
          thumbnail_path: string | null
          download_count: number
          rating_average: number
          rating_count: number
          featured: boolean
          approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description?: string | null
          uploader_id: string
          department: string
          level: string
          price: number
          tags?: string[]
          file_type: string
          file_size?: number | null
          storage_path: string
          thumbnail_path?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          department?: string
          level?: string
          price?: number
          tags?: string[]
          thumbnail_path?: string | null
          featured?: boolean
          approved?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          resource_id: string
          amount: number
          status: string
          transaction_type: string
          payment_method: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          buyer_id: string
          seller_id: string
          resource_id: string
          amount: number
          status?: string
          transaction_type?: string
          payment_method?: string
          reference_id?: string | null
        }
        Update: {
          status?: string
        }
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
