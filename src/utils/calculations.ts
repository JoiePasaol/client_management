/**
 * Utility functions for calculations and business logic
 */

export const calculatePaymentProgress = (totalPaid: number, budget: number): number => {
    if (budget === 0) return 0;
    return Math.min((totalPaid / budget) * 100, 100);
  };
  
  export const calculateDaysUntilDeadline = (deadline: string): number => {
    return Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  };
  
  export const getDeadlineStatus = (deadline: string) => {
    const days = calculateDaysUntilDeadline(deadline);
    const isOverdue = days < 0;
    
    return {
      days: Math.abs(days),
      isOverdue,
      status: isOverdue ? 'overdue' : days <= 7 ? 'warning' : 'normal',
      message: isOverdue 
        ? `${Math.abs(days)} days overdue`
        : `${days} days remaining`
    };
  };

  
  export const shouldRevertProjectStatus = (
    currentStatus: string,
    totalPaid: number,
    budget: number
  ): boolean => {
    return currentStatus === "Finished" && totalPaid < budget;
  };
  
  export const isPaymentCompleted = (totalPaid: number, budget: number): boolean => {
    return totalPaid >= budget;
  };