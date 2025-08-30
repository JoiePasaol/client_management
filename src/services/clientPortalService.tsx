// src/services/clientPortalService.ts
import { supabase } from '../lib/supabase'
import { requestQueue } from '../utils/requestQueue'

export interface ClientPortal {
  id: number
  project_id: number
  access_token: string
  is_enabled: boolean
  created_at: string
  expires_at?: string
}

export interface ClientPortalWithProject extends ClientPortal {
  project: {
    id: number
    title: string
    description: string
    deadline: string
    budget: number
    status: 'Started' | 'Finished'
    client: {
      id: number
      full_name: string
      company_name: string
      email: string
    }
    payments: Array<{
      id: number
      amount: number
      payment_date: string
      payment_method: string
    }>
    project_updates: Array<{
      id: number
      description: string
      created_at: string
    }>
  }
}

export const clientPortalService = {
  // Generate a unique access token
  generateAccessToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36)
  },

  // Create or update client portal for a project
  async createOrUpdatePortal(projectId: number): Promise<ClientPortal> {
    return requestQueue.add(async () => {
      // Check if portal already exists
      const { data: existing } = await supabase
        .from('client_portals')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (existing) {
        // Update existing portal with new token
        const { data, error } = await supabase
          .from('client_portals')
          .update({
            access_token: this.generateAccessToken(),
            is_enabled: true,
            expires_at: null // No expiration for now
          })
          .eq('project_id', projectId)
          .select()
          .single()

        if (error) {
          console.error('Error updating client portal:', error)
          throw new Error(`Failed to update client portal: ${error.message}`)
        }

        return data
      } else {
        // Create new portal
        const { data, error } = await supabase
          .from('client_portals')
          .insert({
            project_id: projectId,
            access_token: this.generateAccessToken(),
            is_enabled: true,
            expires_at: null
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating client portal:', error)
          throw new Error(`Failed to create client portal: ${error.message}`)
        }

        return data
      }
    })
  },

  // Get portal by project ID
  async getPortalByProject(projectId: number): Promise<ClientPortal | null> {
    return requestQueue.add(async () => {
      const { data, error } = await supabase
        .from('client_portals')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Portal not found
        }
        console.error('Error fetching client portal:', error)
        throw new Error(`Failed to fetch client portal: ${error.message}`)
      }

      return data
    })
  },

  // Get portal by access token (for client access)
  async getPortalByToken(accessToken: string): Promise<ClientPortalWithProject | null> {
    return requestQueue.add(async () => {
      const { data, error } = await supabase
        .from('client_portals')
        .select(`
          *,
          project:projects(
            id,
            title,
            description,
            deadline,
            budget,
            status,
            client:clients(id, full_name, company_name, email),
            payments:payments(id, amount, payment_date, payment_method),
            project_updates:project_updates(id, description, created_at)
          )
        `)
        .eq('access_token', accessToken)
        .eq('is_enabled', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Portal not found or disabled
        }
        console.error('Error fetching client portal by token:', error)
        throw new Error(`Failed to fetch client portal: ${error.message}`)
      }

      return data as ClientPortalWithProject
    })
  },

  // Toggle portal status (enable/disable)
  async togglePortalStatus(projectId: number, isEnabled: boolean): Promise<ClientPortal> {
    return requestQueue.add(async () => {
      const { data, error } = await supabase
        .from('client_portals')
        .update({ is_enabled: isEnabled })
        .eq('project_id', projectId)
        .select()
        .single()

      if (error) {
        console.error('Error toggling portal status:', error)
        throw new Error(`Failed to toggle portal status: ${error.message}`)
      }

      return data
    })
  },

  // Delete client portal
  async deletePortal(projectId: number): Promise<void> {
    return requestQueue.add(async () => {
      const { error } = await supabase
        .from('client_portals')
        .delete()
        .eq('project_id', projectId)

      if (error) {
        console.error('Error deleting client portal:', error)
        throw new Error(`Failed to delete client portal: ${error.message}`)
      }
    })
  },

  // Generate portal URL
  generatePortalUrl(accessToken: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/client-portal/${accessToken}`
  }
}