// Threshold engine for calendar date calculations and auto-reprioritisation

import type { Task } from '@/types';
import type { ThresholdState, ThresholdRule } from '@/types/calendar';

export const THRESHOLD_RULES: ThresholdRule[] = [
  { days: 0, state: 'overdue', severity: 'urgent', color: '#dc2626', icon: '🚨' },
  { days: 1, state: 'critical', severity: 'critical', color: '#ef4444', icon: '🔴' },
  { days: 3, state: 'warning', severity: 'warning', color: '#f59e0b', icon: '⚠️' },
  { days: 7, state: 'watch', severity: 'advisory', color: '#3b82f6', icon: '⏳' },
];

export function calculateThresholdState(dueDateStr?: string | Date | number): ThresholdState {
  if (!dueDateStr) return 'normal';
  
  const due = new Date(dueDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 1) return 'critical';
  if (diffDays <= 3) return 'warning';
  if (diffDays <= 7) return 'watch';
  return 'normal';
}

export function getDaysUntilDue(dueDateStr?: string | Date | number): number | null {
  if (!dueDateStr) return null;
  
  const due = new Date(dueDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export interface ReprioritisationRecommendation {
  taskId: string;
  currentPriority: string;
  recommendedPriority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  thresholdState: ThresholdState;
}

export function generateReprioritisationRecommendations(tasks: Task[]): ReprioritisationRecommendation[] {
  const recommendations: ReprioritisationRecommendation[] = [];
  
  for (const task of tasks) {
    if (task.column === 'done') continue;
    
    const thresholdState = calculateThresholdState(task.dueDate);
    let recommendedPriority: 'low' | 'medium' | 'high' | 'urgent' | null = null;
    let reason = '';
    
    switch (thresholdState) {
      case 'overdue':
        if (task.priority !== 'urgent') {
          recommendedPriority = 'urgent';
          reason = 'Overdue task requires immediate attention';
        }
        break;
      case 'critical':
        if (task.priority !== 'high' && task.priority !== 'urgent') {
          recommendedPriority = 'high';
          reason = 'Due within 24 hours';
        }
        break;
      case 'warning':
        if (task.priority === 'low') {
          recommendedPriority = 'medium';
          reason = 'Due within 3 days - elevated priority recommended';
        }
        break;
    }
    
    if (recommendedPriority) {
      recommendations.push({
        taskId: task.id,
        currentPriority: task.priority || 'medium',
        recommendedPriority,
        reason,
        thresholdState,
      });
    }
  }
  
  return recommendations;
}

export function shouldAutoReprioritise(thresholdState: ThresholdState): boolean {
  return thresholdState === 'critical' || thresholdState === 'overdue';
}
