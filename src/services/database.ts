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
  type ProjectUpdateForm
} from '../lib/supabase'
import { requestQueue } from '../utils/requestQueue';

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

// Base service class for common operations
class BaseService {
  protected async executeQuery<T>(operation: () => Promise<T>): Promise<T> {
    return requestQueue.add(operation);
  }

  protected handleError(error: any, operation: string): never {
    console.error(`Error ${operation}:`, error);
    throw new Error(`Failed to ${operation}: ${error.message}`);
  }
}

// Client Services
export const clientService = new class extends BaseService {
  async createClient(clientData: {
    full_name: string
    email: string
    phone_number: string
    address: string
    company_name: string
  }): Promise<Client> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single()

      if (error) this.handleError(error, 'create client');
      return data
    });
  }

  async getAllClientsWithStats(): Promise<ClientWithStats[]> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          projects:projects(status, budget)
        `)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'fetch clients');

      return data.map(client => {
        const projects = client.projects || []
        return {
          ...client,
          project_count: projects.length,
          active_project_count: projects.filter(p => p.status === 'Started').length,
          total_revenue: projects.reduce((sum, p) => sum + (p.budget || 0), 0)
        }
      })
    });
  }

  async getClientWithProjects(clientId: number): Promise<ClientWithProjects | null> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          projects:projects(*)
        `)
        .eq('id', clientId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null;
        this.handleError(error, 'fetch client');
      }

      return data
    });
  }

  async updateClient(clientId: number, updates: Partial<Omit<Client, 'id' | 'created_at'>>): Promise<Client> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single()

      if (error) this.handleError(error, 'update client');
      return data
    });
  }

  async deleteClient(clientId: number): Promise<void> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) this.handleError(error, 'delete client');
    });
  }
}

// Project Services
export const projectService = new class extends BaseService {
  async createProject(projectData: {
    client_id: number
    title: string
    description: string
    deadline: string
    budget: number
    status: 'Started' | 'Finished'
    invoice_url?: string
  }): Promise<Project> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) this.handleError(error, 'create project');
      return data
    });
  }

  async getAllProjectsWithStats(): Promise<ProjectWithStats[]> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, full_name, company_name),
          payments:payments(amount),
          project_updates:project_updates(id)
        `)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'fetch projects with stats');

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
  }

  async getProjectWithStats(projectId: number): Promise<(ProjectWithStats & {
    payments: Payment[]
    project_updates: ProjectUpdate[]
  }) | null> {
    return this.executeQuery(async () => {
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
        if (error.code === 'PGRST116') return null;
        this.handleError(error, 'fetch project');
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
  }

  async updateProject(projectId: number, updates: Partial<Omit<Project, 'id' | 'client_id' | 'created_at'>>): Promise<Project> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single()

      if (error) this.handleError(error, 'update project');
      return data
    });
  }

  async deleteProject(projectId: number): Promise<void> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) this.handleError(error, 'delete project');
    });
  }
}

// Payment Services
export const paymentService = new class extends BaseService {
  async createPayment(paymentData: {
    projectId: number
    amount: number
    paymentDate: string
    paymentMethod: 'Bank Transfer' | 'Cash' | 'Check'
  }): Promise<Payment> {
    return this.executeQuery(async () => {
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

      if (error) this.handleError(error, 'create payment');
      return data
    });
  }

  async deletePayment(paymentId: number): Promise<void> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      if (error) this.handleError(error, 'delete payment');
    });
  }
}

// Project Updates Services
export const projectUpdateService = new class extends BaseService {
  async createProjectUpdate(updateData: {
    projectId: number
    description: string
  }): Promise<ProjectUpdate> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('project_updates')
        .insert({
          project_id: updateData.projectId,
          description: updateData.description,
        })
        .select()
        .single()

      if (error) this.handleError(error, 'create project update');
      return data
    });
  }

  async deleteProjectUpdate(updateId: number): Promise<void> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('project_updates')
        .delete()
        .eq('id', updateId)

      if (error) this.handleError(error, 'delete project update');
    });
  }
}

// File upload service
export const fileService = new class extends BaseService {
  async uploadInvoice(file: File, projectId: number): Promise<string> {
    return this.executeQuery(async () => {
      const fileName = `invoices/${projectId}-${Date.now()}-${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file)

      if (uploadError) this.handleError(uploadError, 'upload invoice');

      const { data } = supabase.storage
        .from('project-files')
        .getPublicUrl(fileName)

      return data.publicUrl
    });
  }
}

// Re-export types
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
  RecentActivity
}