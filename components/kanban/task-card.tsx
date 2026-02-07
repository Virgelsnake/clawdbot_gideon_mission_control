'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useTask } from '@/contexts/task-context';
import type { Task, TaskPriority } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  Flag,
  AlertCircle,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  low: {
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    icon: <Flag className="h-3 w-3" />,
    label: 'Low',
  },
  medium: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    icon: <Flag className="h-3 w-3" />,
    label: 'Medium',
  },
  high: {
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    icon: <Flag className="h-3 w-3" />,
    label: 'High',
  },
  urgent: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/30',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Urgent',
  },
};

const LABEL_COLORS: Record<string, string> = {
  bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  feature: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  enhancement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  docs: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  research: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `in ${diffDays} days`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(timestamp?: number): boolean {
  if (!timestamp) return false;
  return new Date(timestamp) < new Date() && new Date(timestamp).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
}

export function TaskCard({ task, onTaskClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const { updateTask, deleteTask } = useTask();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim() });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    deleteTask(task.id);
    setIsDeleting(false);
  };

  const priority = task.priority || 'medium';
  const priorityConfig = PRIORITY_CONFIG[priority];
  const overdue = isOverdue(task.dueDate);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => onTaskClick?.(task)}
        className={`rounded-lg border border-border/60 bg-card p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-grab active:cursor-grabbing group transition-all duration-200 ease-out hover:shadow-md hover:border-border hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isDragging ? 'opacity-50 rotate-[3deg] scale-105 shadow-xl ring-2 ring-primary/30 border-primary/40' : ''
        }`}
        aria-label={`Task: ${task.title}`}
        tabIndex={0}
      >
        {/* Labels Row */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.slice(0, 3).map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className={`text-[10px] px-1.5 py-0 h-[18px] font-medium border-0 ${LABEL_COLORS[label] || 'bg-muted text-muted-foreground'}`}
              >
                {label}
              </Badge>
            ))}
            {task.labels.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[18px] text-muted-foreground">
                +{task.labels.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Title Row */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-6 sm:w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleting(true)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {task.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Footer Row */}
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Priority Badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityConfig.bg} ${priorityConfig.color}`}>
              {priorityConfig.icon}
              {priorityConfig.label}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${overdue ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 font-medium' : 'text-muted-foreground'}`}>
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Assignee */}
          {task.assignee && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-medium">
                {getInitials(task.assignee)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task title.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Task title..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editTitle.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{task.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
