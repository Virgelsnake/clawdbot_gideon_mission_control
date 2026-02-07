'use client';

import { useTask } from '@/contexts/task-context';
import type { Task, KanbanColumn } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ArrowUpDown, Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TaskCard } from './task-card';

type SortField = 'title' | 'column' | 'priority' | 'dueDate' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const COLUMN_LABELS: Record<KanbanColumn, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-amber-100 text-amber-600',
  urgent: 'bg-red-100 text-red-600',
};

interface TaskListProps {
  onTaskClick?: (task: Task) => void;
}

export function TaskList({ onTaskClick }: TaskListProps) {
  const { filteredTasks, moveTask, deleteTask } = useTask();
  const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'column':
          comparison = a.column.localeCompare(b.column);
          break;
        case 'priority':
          const priorityA = a.priority || 'low';
          const priorityB = b.priority || 'low';
          const priorityOrder: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 };
          comparison = priorityOrder[priorityA] - priorityOrder[priorityB];
          break;
        case 'dueDate':
          const dueA = a.dueDate || 0;
          const dueB = b.dueDate || 0;
          comparison = dueA - dueB;
          break;
        case 'createdAt':
        default:
          comparison = a.createdAt - b.createdAt;
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredTasks, sort]);

  const handleSort = (field: SortField) => {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const handleStatusChange = (taskId: string, newColumn: KanbanColumn) => {
    moveTask(taskId, newColumn);
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">No tasks found</p>
        <p className="text-xs text-muted-foreground max-w-[240px] text-center">
          Try adjusting your filters or create a new task to get started
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <div className="border rounded-lg bg-card">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort('title')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors',
                    sort.field === 'title' && 'text-foreground'
                  )}
                >
                  Task
                  <ArrowUpDown
                    className={cn(
                      'h-3 w-3',
                      sort.field === 'title' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                    )}
                  />
                </button>
              </th>
              <th className="text-left py-3 px-2 w-32">
                <button
                  onClick={() => handleSort('column')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors',
                    sort.field === 'column' && 'text-foreground'
                  )}
                >
                  Status
                  <ArrowUpDown
                    className={cn(
                      'h-3 w-3',
                      sort.field === 'column' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                    )}
                  />
                </button>
              </th>
              <th className="text-left py-3 px-2 w-28">
                <button
                  onClick={() => handleSort('priority')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors',
                    sort.field === 'priority' && 'text-foreground'
                  )}
                >
                  Priority
                  <ArrowUpDown
                    className={cn(
                      'h-3 w-3',
                      sort.field === 'priority' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                    )}
                  />
                </button>
              </th>
              <th className="text-left py-3 px-2 w-32">
                <span className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  <User className="h-3 w-3" />
                  Assignee
                </span>
              </th>
              <th className="text-left py-3 px-2 w-36">
                <button
                  onClick={() => handleSort('dueDate')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors',
                    sort.field === 'dueDate' && 'text-foreground'
                  )}
                >
                  Due Date
                  <ArrowUpDown
                    className={cn(
                      'h-3 w-3',
                      sort.field === 'dueDate' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                    )}
                  />
                </button>
              </th>
              <th className="text-left py-3 px-2 w-28">
                <button
                  onClick={() => handleSort('createdAt')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors',
                    sort.field === 'createdAt' && 'text-foreground'
                  )}
                >
                  Created
                  <ArrowUpDown
                    className={cn(
                      'h-3 w-3',
                      sort.field === 'createdAt' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                    )}
                  />
                </button>
              </th>
              <th className="w-12 py-3 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedTasks.map((task) => (
              <tr
                key={task.id}
                className="group hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onTaskClick?.(task)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {task.labels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded bg-secondary text-secondary-foreground"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border bg-background hover:bg-muted transition-colors">
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            task.column === 'backlog' && 'bg-slate-400',
                            task.column === 'todo' && 'bg-blue-400',
                            task.column === 'in-progress' && 'bg-amber-400',
                            task.column === 'review' && 'bg-purple-400',
                            task.column === 'done' && 'bg-emerald-400'
                          )}
                        />
                        {COLUMN_LABELS[task.column]}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {(Object.keys(COLUMN_LABELS) as KanbanColumn[]).map((column) => (
                        <DropdownMenuItem
                          key={column}
                          onClick={() => handleStatusChange(task.id, column)}
                          className="text-xs"
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full mr-2',
                              column === 'backlog' && 'bg-slate-400',
                              column === 'todo' && 'bg-blue-400',
                              column === 'in-progress' && 'bg-amber-400',
                              column === 'review' && 'bg-purple-400',
                              column === 'done' && 'bg-emerald-400'
                            )}
                          />
                          {COLUMN_LABELS[column]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                <td className="py-3 px-2">
                  {task.priority ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs font-medium',
                        PRIORITY_COLORS[task.priority]
                      )}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {PRIORITY_LABELS[task.priority]}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  {task.assignee ? (
                    <span className="text-xs flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {task.assignee}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  {task.dueDate ? (
                    <span className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(task.dueDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTask(task)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(task.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inline Edit Dialog */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
              <TaskCard task={editingTask} />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
