// Calendar types for Mission Control Calendar Tab

export type CalendarView = 'month' | 'timeline';

export type ThresholdState = 'normal' | 'watch' | 'warning' | 'critical' | 'overdue';

export interface CalendarProject {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  column: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  thresholdState: ThresholdState;
  assignee?: string;
  labels?: string[];
}

export interface CalendarDay {
  date: string;
  projects: CalendarProject[];
  isToday: boolean;
  isWeekend: boolean;
}

export interface ThresholdRule {
  days: number;
  state: ThresholdState;
  severity: 'advisory' | 'warning' | 'critical' | 'urgent';
  color: string;
  icon: string;
}

export const THRESHOLD_RULES: ThresholdRule[] = [
  { days: 0, state: 'overdue', severity: 'urgent', color: '#dc2626', icon: '🚨' },
  { days: 1, state: 'critical', severity: 'critical', color: '#ef4444', icon: '🔴' },
  { days: 3, state: 'warning', severity: 'warning', color: '#f59e0b', icon: '⚠️' },
  { days: 7, state: 'watch', severity: 'advisory', color: '#3b82f6', icon: '⏳' },
];

export function calculateThresholdState(dueDateStr?: string): ThresholdState {
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

export function getThresholdBadge(state: ThresholdState): { label: string; color: string; icon: string } {
  switch (state) {
    case 'overdue':
      return { label: 'OVERDUE', color: '#dc2626', icon: '🚨' };
    case 'critical':
      return { label: '24h', color: '#ef4444', icon: '🔴' };
    case 'warning':
      return { label: 'Due Soon', color: '#f59e0b', icon: '⚠️' };
    case 'watch':
      return { label: 'Watch', color: '#3b82f6', icon: '⏳' };
    default:
      return { label: '', color: '#64748b', icon: '' };
  }
}
