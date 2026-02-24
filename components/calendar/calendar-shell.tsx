'use client';

import { useState, useMemo } from 'react';
import { useTask } from '@/contexts/task-context';
import { calculateThresholdState } from '@/lib/calendar/threshold-engine';
import { groupProjectsByDate } from '@/lib/calendar/calendar-api';
import type { CalendarProject } from '@/types/calendar';
import { CalendarMonthNavigator } from './calendar-month-navigator';
import { CalendarDayDetail } from './calendar-day-detail';
import { Card } from '@/components/ui/card';

export function CalendarShell() {
  const { tasks } = useTask();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
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
