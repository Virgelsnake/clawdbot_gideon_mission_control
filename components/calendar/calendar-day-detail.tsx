'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CalendarProject } from '@/types/calendar';
import { getThresholdBadge } from '@/types/calendar';
import { TaskDetailDialog } from '@/components/kanban/task-detail-dialog';
import { useTask } from '@/contexts/task-context';
import { Calendar, MoreHorizontal, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarDayDetailProps {
  date: Date;
  projects: CalendarProject[];
}

export function CalendarDayDetail({ date, projects }: CalendarDayDetailProps) {
  const { tasks, updateTask } = useTask();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const sortedProjects = [...projects].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null;

  const handleQuickReschedule = async (taskId: string, daysToAdd: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dueDate) return;

    const currentDue = new Date(task.dueDate);
    const newDue = new Date(currentDue);
    newDue.setDate(newDue.getDate() + daysToAdd);

    try {
      await updateTask(taskId, { dueDate: newDue.getTime() });
      toast.success(`Rescheduled to ${newDue.toLocaleDateString('en-GB')}`);
    } catch (error) {
      toast.error('Failed to reschedule');
    }
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('text/plain', projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('text/plain');
    if (!projectId) return;

    const task = tasks.find(t => t.id === projectId);
    if (!task) return;

    const newDue = new Date(targetDate);
    newDue.setHours(0, 0, 0, 0);

    try {
      await updateTask(projectId, { dueDate: newDue.getTime() });
      toast.success(`Moved to ${targetDate.toLocaleDateString('en-GB')}`);
    } catch (error) {
      toast.error('Failed to move project');
    }
  };

  return (
    <Card 
      className="p-4 min-h-[400px]"
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, date)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">{dateStr}</h2>
          <p className="text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''} due
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span className="text-xs">Drag projects here to reschedule</span>
        </div>
      </div>

      {/* Projects list */}
      <div className="space-y-3">
        {sortedProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
            No projects due on this date
            <p className="text-sm mt-1">Drag projects here to reschedule</p>
          </div>
        ) : (
          sortedProjects.map(project => {
            const badge = getThresholdBadge(project.thresholdState);
            const task = tasks.find(t => t.id === project.id);

            return (
              <Card
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStart(e, project.id)}
                className="p-4 cursor-move hover:border-primary transition-colors"
                style={badge.label ? { borderLeft: `3px solid ${badge.color}` } : undefined}
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedTaskId(project.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{project.title}</h3>
                      {badge.label && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: badge.color, color: badge.color }}
                        >
                          {badge.icon} {badge.label}
                        </Badge>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {project.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {project.column.replace('-', ' ')}
                      </Badge>
                      {project.assignee && (
                        <span className="text-xs text-muted-foreground">
                          @{project.assignee}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick reschedule dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleQuickReschedule(project.id, 1)}>
                        <Calendar className="h-3 w-3 mr-2" />
                        Tomorrow
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQuickReschedule(project.id, 3)}>
                        <Calendar className="h-3 w-3 mr-2" />
                        +3 Days
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQuickReschedule(project.id, 7)}>
                        <Calendar className="h-3 w-3 mr-2" />
                        Next Week
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />
    </Card>
  );
}
