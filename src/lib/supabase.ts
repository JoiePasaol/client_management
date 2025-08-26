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

export interface Payment {
  id: number
  project_id: number
  amount: number
  payment_date: string
  payment_method: 'Bank Transfer' | 'Cash' | 'Check'
  created_at: string
}

export interface ProjectUpdate {
  id: number
  project_id: number
  description: string
  created_at: string
}

export interface ClientWithProjects extends Client {
  projects: Project[]
}


export interface ProjectWithStats extends Project {
  client: {
    id: number
    full_name: string
    company_name: string
  }
  payment_count: number
  total_paid: number
  update_count: number
}

export interface ClientWithStats extends Client {
  project_count: number
  active_project_count: number
  total_revenue: number
  total_paid?: number
  total_updates?: number
}

export interface PaymentWithDetails extends Payment {
  project: {
    id: number
    title: string
    client: {
      id: number
      full_name: string
      company_name: string
    }
  }
}

export interface ProjectUpdateWithDetails extends ProjectUpdate {
  project: {
    id: number
    title: string
    client: {
      id: number
      full_name: string
      company_name: string
    }
  }
}


export interface ProjectWithClient {
  id: number
  title: string
  description: string
  deadline: string
  budget: number
  status: "Started" | "Finished"
  invoice_url?: string
  created_at: string
  client: {
    id: number
    full_name: string
    company_name: string
    email: string
    phone_number: string
    address: string
  }
}

export interface PaymentForm {
  amount: number
  paymentDate: string
  paymentMethod: "Bank Transfer" | "Cash" | "Check"
}

export interface ProjectUpdateForm {
  description: string
}

export interface DeleteData {
  type: "project" | "payment" | "update"
  id: number
  name: string
  amount?: number
}

export interface DashboardStats {
  totalClients: number;
  totalProjects: number;
  monthlyRevenue: number;
  totalRevenue: number;
}

export interface ProjectStatusStats {
  started: number;
  finished: number;
  total: number;
}

export interface FinancialStats {
  totalBudget: number;
  totalPaid: number;
  outstanding: number;
}

type ProjectWithClientAndStats = {
  id: number;
  title: string;
  description: string;
  deadline: string;
  budget: number;
  status: "Started" | "Finished";
  invoice_url?: string;
  created_at: string;
  client: {
    id: number;
    full_name: string;
    company_name: string;
  };
  payment_count: number;
  total_paid: number;
  update_count: number;
};