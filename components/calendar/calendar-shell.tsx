'use client';

import { useState, useMemo } from 'react';
import { useTask } from '@/contexts/task-context';
import { useSettings } from '@/contexts/settings-context';
import { calculateThresholdState } from '@/lib/calendar/threshold-engine';
import { groupProjectsByDate } from '@/lib/calendar/calendar-api';
import { useAutoReprioritisation } from '@/lib/calendar/use-auto-reprioritisation';
import type { CalendarProject } from '@/types/calendar';
import { CalendarMonthNavigator } from './calendar-month-navigator';
import { CalendarDayDetail } from './calendar-day-detail';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function CalendarShell() {
  const { tasks } = useTask();
  const { settings } = useSettings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Enable auto-reprioritisation (respects feature flags)
  const { isEnabled: autoReprioritiseEnabled } = useAutoReprioritisation();

  // Check if calendar v2 is enabled
  const calendarEnabled = settings.features.calendarV2Enabled;

  // Convert tasks to calendar projects synchronously
  const calendarData = useMemo(() => {
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

    return { projects, overdueCount, criticalCount, warningCount, watchCount };
  }, [tasks]);

  const groupedProjects = useMemo(() => {
    return groupProjectsByDate(calendarData.projects);
  }, [calendarData.projects]);

  const selectedDateStr = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const selectedProjects = useMemo(() => {
    return groupedProjects.get(selectedDateStr) || [];
  }, [groupedProjects, selectedDateStr]);

  const stats = [
    { label: 'Overdue', count: calendarData.overdueCount, color: '#dc2626' },
    { label: 'Critical', count: calendarData.criticalCount, color: '#ef4444' },
    { label: 'Warning', count: calendarData.warningCount, color: '#f59e0b' },
    { label: 'Watch', count: calendarData.watchCount, color: '#3b82f6' },
  ];

  const showAutoReprioritiseBadge = !autoReprioritiseEnabled && (calendarData.overdueCount > 0 || calendarData.criticalCount > 0);

  // Show disabled message if calendar v2 is not enabled
  if (!calendarEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Calendar V2 Disabled</h2>
        <p className="text-muted-foreground text-center max-w-md">
          The new calendar features are currently disabled. Enable them in Settings → Features.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Calendar</h1>
          {showAutoReprioritiseBadge && (
            <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              Auto-reprioritisation disabled
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {stats.map(stat => (
            <Card key={stat.label} className="px-3 py-1.5 flex items-center gap-2" style={{ borderLeft: `3px solid ${stat.color}` }}>
              <span className="text-sm font-medium">{stat.label}</span>
              <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.count}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Main calendar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Month navigator */}
        <CalendarMonthNavigator
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          groupedProjects={groupedProjects}
        />

        {/* Day detail panel */}
        <CalendarDayDetail
          date={selectedDate}
          projects={selectedProjects}
        />
      </div>
    </div>
  );
}
