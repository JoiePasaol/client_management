// src/services/database.ts
import { 
  supabase, 
  type Client, 
  type Project, 
  type ClientWithProjects, 
  type Payment, 
  type ProjectUpdate,
  type ClientWithStats,
  type ProjectWithStats,
  type PaymentWithDetails,
  type ProjectUpdateWithDetails,
  type ProjectWithClient,
  type PaymentForm,
  type ProjectUpdateForm,
  type DeleteData,
  type DashboardStats,
  type ProjectStatusStats,
  type FinancialStats
} from '../lib/supabase'

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
  async getAllClientsWithStats(): Promise<ClientWithStats[]> {
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

    // Transform the data to match the ClientWithStats interface
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

  // Get client with enhanced statistics including payments and updates
  async getClientWithEnhancedStats(clientId: number): Promise<(ClientWithStats & {
    total_budget: number
    total_paid: number
    total_updates: number
    projects: Array<Project & {
      payment_count: number
      total_paid: number
      update_count: number
    }>
  }) | null> {
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        projects:projects(
          *,
          payments:payments(amount),
          project_updates:project_updates(id)
        )
      `)
      .eq('id', clientId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Client not found
      }
      console.error('Error fetching client with enhanced stats:', error)
      throw new Error(`Failed to fetch client: ${error.message}`)
    }

    // Calculate enhanced statistics
    const projects = client.projects || []
    const projectCount = projects.length
    const activeProjectCount = projects.filter(p => p.status === 'Started').length
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    
    let totalPaid = 0
    let totalUpdates = 0
    
    const enhancedProjects = projects.map(project => {
      const projectPayments = project.payments || []
      const projectUpdates = project.project_updates || []
      
      const projectTotalPaid = projectPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
      const projectUpdateCount = projectUpdates.length
      
      totalPaid += projectTotalPaid
      totalUpdates += projectUpdateCount
      
      return {
        ...project,
        payment_count: projectPayments.length,
        total_paid: projectTotalPaid,
        update_count: projectUpdateCount
      }
    })

    return {
      ...client,
      project_count: projectCount,
      active_project_count: activeProjectCount,
      total_revenue: totalBudget, // Maintaining backward compatibility
      total_budget: totalBudget,
      total_paid: totalPaid,
      total_updates: totalUpdates,
      projects: enhancedProjects
    }
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

  // Get all projects with enhanced statistics
  async getAllProjectsWithStats(): Promise<ProjectWithStats[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(id, full_name, company_name),
        payments:payments(amount),
        project_updates:project_updates(id)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects with stats:', error)
      throw new Error(`Failed to fetch projects with stats: ${error.message}`)
    }

    return (data || []).map(project => {
      const payments = project.payments || []
      const updates = project.project_updates || []
      
      return {
        ...project,
        payment_count: payments.length,
        total_paid: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        update_count: updates.length
      }
    })
  },

  // Get single project with enhanced statistics
  async getProjectWithStats(projectId: number): Promise<(ProjectWithStats & {
    payments: Payment[]
    project_updates: ProjectUpdate[]
  }) | null> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(id, full_name, company_name),
        payments:payments(*),
        project_updates:project_updates(*)
      `)
      .eq('id', projectId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Project not found
      }
      console.error('Error fetching project with stats:', error)
      throw new Error(`Failed to fetch project: ${error.message}`)
    }

    const payments = data.payments || []
    const updates = data.project_updates || []

    return {
      ...data,
      payment_count: payments.length,
      total_paid: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      update_count: updates.length,
      payments: payments,
      project_updates: updates
    }
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

// Payment Services
export const paymentService = {
  // Create a new payment
  async createPayment(paymentData: {
    projectId: number
    amount: number
    paymentDate: string
    paymentMethod: 'Bank Transfer' | 'Cash' | 'Check'
  }): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        project_id: paymentData.projectId,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate,
        payment_method: paymentData.paymentMethod,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating payment:', error)
      throw new Error(`Failed to create payment: ${error.message}`)
    }

    return data
  },

  // Get all payments for a project
  async getPaymentsByProject(projectId: number): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      throw new Error(`Failed to fetch payments: ${error.message}`)
    }

    return data || []
  },

  // Get payment statistics for a project
  async getProjectPaymentStats(projectId: number): Promise<{
    totalPaid: number
    paymentCount: number
    averagePayment: number
    lastPaymentDate: string | null
  }> {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Error fetching payment stats:', error)
      throw new Error(`Failed to fetch payment stats: ${error.message}`)
    }
    
    const payments = data || []
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    const paymentCount = payments.length
    const averagePayment = paymentCount > 0 ? totalPaid / paymentCount : 0
    const lastPaymentDate = payments.length > 0 ? payments[0].payment_date : null
    
    return { totalPaid, paymentCount, averagePayment, lastPaymentDate }
  },

  // Get all payments with project and client information
  async getAllPaymentsWithDetails(): Promise<PaymentWithDetails[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        project:projects(
          id,
          title,
          client:clients(id, full_name, company_name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments with details:', error)
      throw new Error(`Failed to fetch payments with details: ${error.message}`)
    }

    return data || []
  },

  // Delete payment
  async deletePayment(paymentId: number): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)

    if (error) {
      console.error('Error deleting payment:', error)
      throw new Error(`Failed to delete payment: ${error.message}`)
    }
  }
}

// Project Updates Services
export const projectUpdateService = {
  // Create a new project update
  async createProjectUpdate(updateData: {
    projectId: number
    description: string
  }): Promise<ProjectUpdate> {
    const { data, error } = await supabase
      .from('project_updates')
      .insert({
        project_id: updateData.projectId,
        description: updateData.description,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project update:', error)
      throw new Error(`Failed to create project update: ${error.message}`)
    }

    return data
  },

  // Get all updates for a project
  async getUpdatesByProject(projectId: number): Promise<ProjectUpdate[]> {
    const { data, error } = await supabase
      .from('project_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching project updates:', error)
      throw new Error(`Failed to fetch project updates: ${error.message}`)
    }

    return data || []
  },

  // Get all updates with project and client information
  async getAllUpdatesWithDetails(): Promise<ProjectUpdateWithDetails[]> {
    const { data, error } = await supabase
      .from('project_updates')
      .select(`
        *,
        project:projects(
          id,
          title,
          client:clients(id, full_name, company_name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching updates with details:', error)
      throw new Error(`Failed to fetch updates with details: ${error.message}`)
    }

    return data || []
  },

  // Delete project update
  async deleteProjectUpdate(updateId: number): Promise<void> {
    const { error } = await supabase
      .from('project_updates')
      .delete()
      .eq('id', updateId)

    if (error) {
      console.error('Error deleting project update:', error)
      throw new Error(`Failed to delete project update: ${error.message}`)
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

// Re-export types for convenience
export type { 
  Client, 
  Project, 
  ClientWithProjects, 
  Payment, 
  ProjectUpdate,
  ClientWithStats,
  ProjectWithStats,
  PaymentWithDetails,
  ProjectUpdateWithDetails,
  ProjectWithClient,
  PaymentForm,
  ProjectUpdateForm,
  DeleteData,
  DashboardStats,
  ProjectStatusStats,
  FinancialStats
}