// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Client {
  id: number
  full_name: string
  email: string
  phone_number: string
  address: string
  company_name: string
  created_at: string
}

export interface Project {
  id: number
  client_id: number
  title: string
  description: string
  deadline: string
  budget: number
  status: 'Started' | 'Finished'
  invoice_url?: string
  created_at: string
}

export interface ClientWithProjects extends Client {
  projects: Project[]
}