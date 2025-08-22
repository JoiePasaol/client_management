// src/services/database.ts
import { supabase, type Client, type Project, type ClientWithProjects } from '../utils/supabase'

// Client Services
export const clientService = {
  // Create a new client
  async createClient(clientData: {
    full_name: string
    email: string
    phone_number: string
    address: string
    company_name: string
  }): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      throw new Error(`Failed to create client: ${error.message}`)
    }

    return data
  },

  // Get all clients with project counts
  async getAllClientsWithStats(): Promise<Array<Client & { 
    project_count: number
    active_project_count: number
    total_revenue: number
  }>> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        projects:projects(status, budget)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      throw new Error(`Failed to fetch clients: ${error.message}`)
    }

    // Transform the data to match your existing client interface
    return data.map(client => {
      const projects = client.projects || []
      const projectCount = projects.length
      const activeProjectCount = projects.filter(p => p.status === 'Started').length
      const totalRevenue = projects.reduce((sum, p) => sum + (p.budget || 0), 0)

      return {
        ...client,
        project_count: projectCount,
        active_project_count: activeProjectCount,
        total_revenue: totalRevenue
      }
    })
  },

  // Get a single client with all projects
  async getClientWithProjects(clientId: number): Promise<ClientWithProjects | null> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        projects:projects(*)
      `)
      .eq('id', clientId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Client not found
      }
      console.error('Error fetching client:', error)
      throw new Error(`Failed to fetch client: ${error.message}`)
    }

    return data
  },

  // Update client
  async updateClient(clientId: number, updates: Partial<Omit<Client, 'id' | 'created_at'>>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      throw new Error(`Failed to update client: ${error.message}`)
    }

    return data
  },

  // Delete client
  async deleteClient(clientId: number): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (error) {
      console.error('Error deleting client:', error)
      throw new Error(`Failed to delete client: ${error.message}`)
    }
  }
}

// Project Services
export const projectService = {
  // Create a new project
  async createProject(projectData: {
    client_id: number
    title: string
    description: string
    deadline: string
    budget: number
    status: 'Started' | 'Finished'
    invoice_url?: string
  }): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw new Error(`Failed to create project: ${error.message}`)
    }

    return data
  },

  // Get all projects for a client
  async getProjectsByClient(clientId: number): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      throw new Error(`Failed to fetch projects: ${error.message}`)
    }

    return data || []
  },

  // Get all projects with client information
  async getAllProjectsWithClients(): Promise<Array<Project & { 
    client: {
      id: number;
      full_name: string;
      company_name: string;
    }
  }>> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(id, full_name, company_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects with clients:', error)
      throw new Error(`Failed to fetch projects with clients: ${error.message}`)
    }

    return data || []
  },

  // Update project
  async updateProject(projectId: number, updates: Partial<Omit<Project, 'id' | 'client_id' | 'created_at'>>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      throw new Error(`Failed to update project: ${error.message}`)
    }

    return data
  },

  // Delete project
  async deleteProject(projectId: number): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      throw new Error(`Failed to delete project: ${error.message}`)
    }
  }
}

// File upload service for invoices
export const fileService = {
  async uploadInvoice(file: File, projectId: number): Promise<string> {
    const fileName = `invoices/${projectId}-${Date.now()}-${file.name}`
    
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      throw new Error(`Failed to upload invoice: ${uploadError.message}`)
    }

    const { data } = supabase.storage
      .from('project-files')
      .getPublicUrl(fileName)

    return data.publicUrl
  }
}