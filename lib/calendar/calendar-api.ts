// Calendar API layer for fetching and updating calendar data

import type { Task } from '@/types';
import type { CalendarProject } from '@/types/calendar';
import { calculateThresholdState } from './threshold-engine';
import { getTaskWorkflowMeta } from '../task-workflow-meta';

export interface CalendarData {
  projects: CalendarProject[];
  overdueCount: number;
  criticalCount: number;
  warningCount: number;
  watchCount: number;
}

export async function fetchCalendarProjects(tasks: Task[]): Promise<CalendarData> {
  const projects: CalendarProject[] = tasks
    .filter(task => task.dueDate && task.column !== 'done')
    .map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
      priority: task.priority || 'medium',
      column: task.column,
      thresholdState: calculateThresholdState(task.dueDate),
      assignee: task.assignee,
      labels: task.labels,
    }));

  const overdueCount = projects.filter(p => p.thresholdState === 'overdue').length;
  const criticalCount = projects.filter(p => p.thresholdState === 'critical').length;
  const warningCount = projects.filter(p => p.thresholdState === 'warning').length;
  const watchCount = projects.filter(p => p.thresholdState === 'watch').length;

  return {
    projects,
    overdueCount,
    criticalCount,
    warningCount,
    watchCount,
  };
}

export function groupProjectsByDate(projects: CalendarProject[]): Map<string, CalendarProject[]> {
  const grouped = new Map<string, CalendarProject[]>();
  
  for (const project of projects) {
    if (!project.dueDate) continue;
    const date = project.dueDate;
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(project);
  }
  
  return grouped;
}

export interface ReschedulePayload {
  taskId: string;
  newDueDate: string;
  reason?: string;
}

export async function rescheduleTask(payload: ReschedulePayload): Promise<{ ok: boolean; error?: string }> {
  try {
    // This will be implemented with actual Supabase update
    // For now, return success to allow UI testing
    console.log('Rescheduling task:', payload);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
