import { supabase } from '../lib/supabase';
import { requestQueue } from '../utils/requestQueue';

export interface DashboardData {
  stats: {
    totalClients: number;
    totalProjects: number;
    monthlyRevenue: number;
    totalRevenue: number;
  };
  projectStatus: {
    started: number;
    finished: number;
    total: number;
  };
  financials: {
    totalBudget: number;
    totalPaid: number;
    outstanding: number;
  };
  activities: Array<{
    id: string;
    type: string;
    message: string;
    date: string;
    icon_type: 'peso' | 'folder';
    project_id?: number;
    client_name?: string;
    project_title?: string;
    amount?: number;
  }>;
}

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_data');
      
      if (error) {
        console.warn('RPC call failed, falling back to individual queries:', error);
        return await this.getDashboardDataFallback();
      }
      
      return data;
    } catch (error) {
      console.error('Error in getDashboardData:', error);
      return await this.getDashboardDataFallback();
    }
  }

  private async getDashboardDataFallback(): Promise<DashboardData> {
    const [clients, projects, allPayments, activities] = await Promise.all([
      requestQueue.add(() => this.getClientsStats()),
      requestQueue.add(() => this.getProjectsStats()),
      requestQueue.add(() => this.getPaymentsStats()),
      requestQueue.add(() => this.getRecentActivities(4))
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyRevenue = allPayments
      .filter(payment => new Date(payment.payment_date) >= thirtyDaysAgo)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    const totalRevenue = allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
    const totalPaid = allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    return {
      stats: {
        totalClients: clients.length,
        totalProjects: projects.length,
        monthlyRevenue,
        totalRevenue
      },
      projectStatus: {
        started: projects.filter(p => p.status === 'Started').length,
        finished: projects.filter(p => p.status === 'Finished').length,
        total: projects.length
      },
      financials: {
        totalBudget,
        totalPaid,
        outstanding: totalBudget - totalPaid
      },
      activities
    };
  }

  private async getClientsStats() {
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getProjectsStats() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, budget, status')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getPaymentsStats() {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getRecentActivities(limit: number = 4) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activities: any[] = [];
    
    try {
      // Get recent payments
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          created_at,
          project_id,
          project:projects(
            title,
            client:clients(full_name, company_name)
          )
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      payments?.forEach(payment => {
        const clientName = payment.project?.client?.full_name || payment.project?.client?.company_name || 'Unknown Client';
        const projectTitle = payment.project?.title || 'Unknown Project';
        
        activities.push({
          id: `payment-${payment.id}`,
          type: 'payment_received',
          message: `Payment received ₱${payment.amount?.toLocaleString()} from ${clientName} for ${projectTitle}`,
          date: new Date(payment.created_at).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          }),
          created_at: payment.created_at,
          icon_type: 'peso' as const,
          project_id: payment.project_id,
          client_name: clientName,
          project_title: projectTitle,
          amount: payment.amount
        });
      });

      // Get recent project updates
      const { data: updates } = await supabase
        .from('project_updates')
        .select(`
          id,
          description,
          created_at,
          project_id,
          project:projects(
            title,
            client:clients(full_name, company_name)
          )
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      updates?.forEach(update => {
        const clientName = update.project?.client?.full_name || update.project?.client?.company_name || 'Unknown Client';
        const projectTitle = update.project?.title || 'Unknown Project';
        const description = update.description?.length > 50 ? `${update.description.slice(0, 50)}...` : update.description;
        
        activities.push({
          id: `update-${update.id}`,
          type: 'project_updated',
          message: `Project updated: ${description} for ${projectTitle} (${clientName})`,
          date: new Date(update.created_at).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          }),
          created_at: update.created_at,
          icon_type: 'folder' as const,
          project_id: update.project_id,
          client_name: clientName,
          project_title: projectTitle
        });
      });

      // Sort by timestamp and return limited results
      activities.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      
      return activities.slice(0, limit);
      
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
}

export const dashboardService = new DashboardService();

// Re-export types for convenience
export type { 
  PaymentForm,
  ProjectUpdateForm
}