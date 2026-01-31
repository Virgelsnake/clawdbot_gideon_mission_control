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
}

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  low: {
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    icon: <Flag className="h-3 w-3" />,
    label: 'Low',
  },
  medium: {
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    icon: <Flag className="h-3 w-3" />,
    label: 'Medium',
  },
  high: {
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    icon: <Flag className="h-3 w-3" />,
    label: 'High',
  },
  urgent: {
    color: 'text-red-600',
    bg: 'bg-red-100',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Urgent',
  },
};

const LABEL_COLORS: Record<string, string> = {
  bug: 'bg-red-100 text-red-700',
  feature: 'bg-blue-100 text-blue-700',
  enhancement: 'bg-purple-100 text-purple-700',
  docs: 'bg-green-100 text-green-700',
  design: 'bg-pink-100 text-pink-700',
  research: 'bg-amber-100 text-amber-700',
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

export function TaskCard({ task }: TaskCardProps) {
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
        className={`rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing group transition-all duration-200 ease-out hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isDragging ? 'opacity-60 rotate-2 scale-105 shadow-xl ring-2 ring-primary/20' : ''
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
                className={`text-[10px] px-1.5 py-0.5 font-medium ${LABEL_COLORS[label] || 'bg-muted text-muted-foreground'}`}
              >
                {label}
              </Badge>
            ))}
            {task.labels.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
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
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Priority Badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityConfig.bg} ${priorityConfig.color}`}>
              {priorityConfig.icon}
              {priorityConfig.label}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 text-[10px] ${overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Assignee */}
          {task.assignee && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
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
