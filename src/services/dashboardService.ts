// src/services/dashboardService.ts
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

export const dashboardService = {
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
  },

  async getDashboardDataFallback(): Promise<DashboardData> {
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
  },

  async getClientsStats() {
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients stats:', error);
      throw error;
    }
    return data || [];
  },

  async getProjectsStats() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, budget, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects stats:', error);
      throw error;
    }
    return data || [];
  },

  async getPaymentsStats() {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments stats:', error);
      throw error;
    }
    return data || [];
  },

  async getRecentActivities(limit: number = 4) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activities: any[] = [];
    
    try {
      // Get recent payments
      const { data: payments, error: paymentsError } = await supabase
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
        .limit(limit);

      if (paymentsError) {
        console.error('Error fetching payments for activities:', paymentsError);
      } else {
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
            icon_type: 'peso' as const,
            project_id: payment.project_id,
            client_name: clientName,
            project_title: projectTitle,
            amount: payment.amount
          });
        });
      }

      // Get recent project updates
      const { data: updates, error: updatesError } = await supabase
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
        .limit(limit);

      if (updatesError) {
        console.error('Error fetching updates for activities:', updatesError);
      } else {
        updates?.forEach(update => {
          const clientName = update.project?.client?.full_name || update.project?.client?.company_name || 'Unknown Client';
          const projectTitle = update.project?.title || 'Unknown Project';
          const description = update.description?.length > 50 ? `${update.description.slice(0, 50)}...` : update.description;
          
          activities.push({
            id: `update-${update.id}`,
            type: 'project_updated',
            message: `Project updated: ${description} for ${projectTitle} ${clientName}`,
            date: new Date(update.created_at).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            }),
            icon_type: 'folder' as const,
            project_id: update.project_id,
            client_name: clientName,
            project_title: projectTitle
          });
        });
      }

      // Fixed: Only use created_at, no updated_at references
      const { data: finishedProjects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          created_at,
          client:clients(full_name, company_name)
        `)
        .eq('status', 'Finished')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (projectsError) {
        console.error('Error fetching finished projects for activities:', projectsError);
      } else {
        finishedProjects?.forEach(project => {
          const clientName = project.client?.full_name || project.client?.company_name || 'Unknown Client';
          
          activities.push({
            id: `project-finished-${project.id}`,
            type: 'project_finished',
            message: `Project completed: ${project.title} for ${clientName}`,
            date: new Date(project.created_at).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            }),
            icon_type: 'folder' as const,
            project_id: project.id,
            client_name: clientName,
            project_title: project.title
          });
        });
      }

      activities.sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
      });
      
      return activities.slice(0, limit);
      
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
};