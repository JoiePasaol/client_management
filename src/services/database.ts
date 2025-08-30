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
import { requestQueue } from '../utils/requestQueue';

// Activity Types - Keep your existing interface
export interface RecentActivity {
  id: string
  type: 'payment_received' | 'project_updated' | 'project_finished' | 'payment_deleted' | 'update_deleted'
  message: string
  date: string
  icon_type: 'peso' | 'folder'
  project_id?: number
  client_name?: string
  project_title?: string
  amount?: number
}

// Client Services - Updated with request queue
export const clientService = {
  // Create a new client
  async createClient(clientData: {
    full_name: string
    email: string
    phone_number: string
    address: string
    company_name: string
  }): Promise<Client> {
    return requestQueue.add(async () => {
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
    });
  },

  // Get all clients with project counts
  async getAllClientsWithStats(): Promise<ClientWithStats[]> {
    return requestQueue.add(async () => {
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
    });
  },

  // Get a single client with all projects
  async getClientWithProjects(clientId: number): Promise<ClientWithProjects | null> {
    return requestQueue.add(async () => {
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
    });
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
    return requestQueue.add(async () => {
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
    });
  },

  // Update client
  async updateClient(clientId: number, updates: Partial<Omit<Client, 'id' | 'created_at'>>): Promise<Client> {
    return requestQueue.add(async () => {
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
    });
  },

  // Delete client
  async deleteClient(clientId: number): Promise<void> {
    return requestQueue.add(async () => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) {
        console.error('Error deleting client:', error)
        throw new Error(`Failed to delete client: ${error.message}`)
      }
    });
  }
}

// Project Services - Updated with request queue
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
    return requestQueue.add(async () => {
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
    });
  },

  // Get all projects for a client
  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return requestQueue.add(async () => {
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
    });
  },

  // Get all projects with client information
  async getAllProjectsWithClients(): Promise<Array<Project & { 
    client: {
      id: number;
      full_name: string;
      company_name: string;
    }
  }>> {
    return requestQueue.add(async () => {
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
    });
  },

  // Get all projects with enhanced statistics
  async getAllProjectsWithStats(): Promise<ProjectWithStats[]> {
    return requestQueue.add(async () => {
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
    });
  },

  // Get single project with enhanced statistics
  async getProjectWithStats(projectId: number): Promise<(ProjectWithStats & {
    payments: Payment[]
    project_updates: ProjectUpdate[]
  }) | null> {
    return requestQueue.add(async () => {
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
    });
  },

  // Update project
  async updateProject(projectId: number, updates: Partial<Omit<Project, 'id' | 'client_id' | 'created_at'>>): Promise<Project> {
    return requestQueue.add(async () => {
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
    });
  },

  // Delete project
  async deleteProject(projectId: number): Promise<void> {
    return requestQueue.add(async () => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        console.error('Error deleting project:', error)
        throw new Error(`Failed to delete project: ${error.message}`)
      }
    });
  }
}

// Payment Services - Updated with request queue
export const paymentService = {
  // Create a new payment
  async createPayment(paymentData: {
    projectId: number
    amount: number
    paymentDate: string
    paymentMethod: 'Bank Transfer' | 'Cash' | 'Check'
  }): Promise<Payment> {
    return requestQueue.add(async () => {
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
    });
  },

  // Get all payments for a project
  async getPaymentsByProject(projectId: number): Promise<Payment[]> {
    return requestQueue.add(async () => {
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
    });
  },

  // Get payment statistics for a project
  async getProjectPaymentStats(projectId: number): Promise<{
    totalPaid: number
    paymentCount: number
    averagePayment: number
    lastPaymentDate: string | null
  }> {
    return requestQueue.add(async () => {
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
    });
  },

  // Get all payments with project and client information
  async getAllPaymentsWithDetails(): Promise<PaymentWithDetails[]> {
    return requestQueue.add(async () => {
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
    });
  },

  // Delete payment
  async deletePayment(paymentId: number): Promise<void> {
    return requestQueue.add(async () => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      if (error) {
        console.error('Error deleting payment:', error)
        throw new Error(`Failed to delete payment: ${error.message}`)
      }
    });
  }
}

// Project Updates Services - Updated with request queue
export const projectUpdateService = {
  // Create a new project update
  async createProjectUpdate(updateData: {
    projectId: number
    description: string
  }): Promise<ProjectUpdate> {
    return requestQueue.add(async () => {
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
    });
  },

  // Get all updates for a project
  async getUpdatesByProject(projectId: number): Promise<ProjectUpdate[]> {
    return requestQueue.add(async () => {
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
    });
  },

  // Get all updates with project and client information
  async getAllUpdatesWithDetails(): Promise<ProjectUpdateWithDetails[]> {
    return requestQueue.add(async () => {
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
    });
  },

  // Delete project update
  async deleteProjectUpdate(updateId: number): Promise<void> {
    return requestQueue.add(async () => {
      const { error } = await supabase
        .from('project_updates')
        .delete()
        .eq('id', updateId)

      if (error) {
        console.error('Error deleting project update:', error)
        throw new Error(`Failed to delete project update: ${error.message}`)
      }
    });
  }
}

// Activity Services - Updated with request queue
export const activityService = {
  // Get recent activities (last 30 days)
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    return requestQueue.add(async () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const activities: RecentActivity[] = []
      
      try {
        // Get recent payments
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            *,
            project:projects(
              id,
              title,
              status,
              client:clients(full_name, company_name)
            )
          `)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
        
        if (paymentsError) {
          console.error('Error fetching recent payments:', paymentsError)
        } else {
          payments?.forEach(payment => {
            const clientName = payment.project?.client?.full_name || payment.project?.client?.company_name || 'Unknown Client'
            const projectTitle = payment.project?.title || 'Unknown Project'
            
            activities.push({
              id: `payment-${payment.id}`,
              type: 'payment_received',
              message: `Payment received ₱${payment.amount.toLocaleString()} from ${clientName} for ${projectTitle}`,
              date: new Date(payment.created_at).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit', 
                year: 'numeric'
              }),
              icon_type: 'peso',
              project_id: payment.project_id,
              client_name: clientName,
              project_title: projectTitle,
              amount: payment.amount
            })
          })
        }

        // Get recent project updates
        const { data: updates, error: updatesError } = await supabase
          .from('project_updates')
          .select(`
            *,
            project:projects(
              id,
              title,
              status,
              client:clients(full_name, company_name)
            )
          `)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
        
        if (updatesError) {
          console.error('Error fetching recent updates:', updatesError)
        } else {
          updates?.forEach(update => {
            const clientName = update.project?.client?.full_name || update.project?.client?.company_name || 'Unknown Client'
            const projectTitle = update.project?.title || 'Unknown Project'
            const description = update.description.length > 50 ? `${update.description.slice(0, 50)}...` : update.description
            
            activities.push({
              id: `update-${update.id}`,
              type: 'project_updated',
              message: `Project updated: ${description} from ${clientName} for ${projectTitle} `,
              date: new Date(update.created_at).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
              }),
              icon_type: 'folder',
              project_id: update.project_id,
              client_name: clientName,
              project_title: projectTitle
            })
          })
        }

        // Get recently finished projects
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            client:clients(full_name, company_name)
          `)
          .eq('status', 'Finished')
          .gte('updated_at', thirtyDaysAgo.toISOString())
          .order('updated_at', { ascending: false })
        
        if (projectsError) {
          console.error('Error fetching finished projects:', projectsError)
        } else {
          projects?.forEach(project => {
            const clientName = project.client?.full_name || project.client?.company_name || 'Unknown Client'
            
            activities.push({
              id: `project-finished-${project.id}`,
              type: 'project_finished',
              message: `Project completed: ${project.title} for ${clientName}`,
              date: new Date(project.updated_at || project.created_at).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
              }),
              icon_type: 'folder',
              project_id: project.id,
              client_name: clientName,
              project_title: project.title
            })
          })
        }

        // Sort all activities by date (most recent first)
        activities.sort((a, b) => {
          const dateA = new Date(a.date.split('/').reverse().join('-'))
          const dateB = new Date(b.date.split('/').reverse().join('-'))
          return dateB.getTime() - dateA.getTime()
        })
        
        return activities.slice(0, limit)
        
      } catch (error) {
        console.error('Error fetching recent activities:', error)
        throw new Error('Failed to fetch recent activities')
      }
    });
  }
}

// Enhanced payment service with activity tracking - Updated with request queue
export const enhancedPaymentService = {
  ...paymentService,
  
  // Delete payment with activity tracking
  async deletePaymentWithActivity(paymentId: number): Promise<RecentActivity> {
    return requestQueue.add(async () => {
      // First get the payment details before deleting
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select(`
          *,
          project:projects(
            id,
            title,
            client:clients(full_name, company_name)
          )
        `)
        .eq('id', paymentId)
        .single()
      
      if (fetchError) {
        console.error('Error fetching payment for deletion:', fetchError)
        throw new Error('Failed to fetch payment details')
      }
      
      // Delete the payment
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)
      
      if (deleteError) {
        console.error('Error deleting payment:', deleteError)
        throw new Error('Failed to delete payment')
      }
      
      // Create activity record
      const clientName = payment.project?.client?.full_name || payment.project?.client?.company_name || 'Unknown Client'
      const projectTitle = payment.project?.title || 'Unknown Project'
      
      return {
        id: `payment-deleted-${paymentId}-${Date.now()}`,
        type: 'payment_deleted',
        message: `Payment deleted: ₱${payment.amount.toLocaleString()} from ${clientName} for ${projectTitle}`,
        date: new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }),
        icon_type: 'peso',
        project_id: payment.project_id,
        client_name: clientName,
        project_title: projectTitle,
        amount: payment.amount
      }
    });
  }
}

// Enhanced project update service with activity tracking - Updated with request queue
export const enhancedProjectUpdateService = {
  ...projectUpdateService,
  
  // Delete project update with activity tracking
  async deleteProjectUpdateWithActivity(updateId: number): Promise<RecentActivity> {
    return requestQueue.add(async () => {
      // First get the update details before deleting
      const { data: update, error: fetchError } = await supabase
        .from('project_updates')
        .select(`
          *,
          project:projects(
            id,
            title,
            client:clients(full_name, company_name)
          )
        `)
        .eq('id', updateId)
        .single()
      
      if (fetchError) {
        console.error('Error fetching update for deletion:', fetchError)
        throw new Error('Failed to fetch update details')
      }
      
      // Delete the update
      const { error: deleteError } = await supabase
        .from('project_updates')
        .delete()
        .eq('id', updateId)
      
      if (deleteError) {
        console.error('Error deleting project update:', deleteError)
        throw new Error('Failed to delete project update')
      }
      
      // Create activity record
      const clientName = update.project?.client?.full_name || update.project?.client?.company_name || 'Unknown Client'
      const projectTitle = update.project?.title || 'Unknown Project'
      
      return {
        id: `update-deleted-${updateId}-${Date.now()}`,
        type: 'update_deleted',
        message: `Project update deleted for ${projectTitle} (${clientName})`,
        date: new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }),
        icon_type: 'folder',
        project_id: update.project_id,
        client_name: clientName,
        project_title: projectTitle
      }
    });
  }
}

// File upload service for invoices - Updated with request queue
export const fileService = {
  async uploadInvoice(file: File, projectId: number): Promise<string> {
    return requestQueue.add(async () => {
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
    });
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
  FinancialStats,
  RecentActivity
}