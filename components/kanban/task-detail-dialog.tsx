'use client';

import { useState, useEffect } from 'react';
import type { Task, TaskComment, TaskPriority } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Flag,
  AlertCircle,
  User,
  FileText,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createTaskContextDoc, getTaskContextDoc } from '@/lib/task-context-doc-client';
import { getTaskWorkflowMeta, setTaskWorkflowMeta } from '@/lib/task-workflow-meta';
import { toast } from 'sonner';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(timestamp);
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const [docExists, setDocExists] = useState(false);
  const [docPath, setDocPath] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [contextForm, setContextForm] = useState({
    objective: '',
    briefPath: '',
    prdPath: '',
    taskListPath: '',
    definitionOfDone: '',
    currentState: '',
    nextActions: '',
  });
  const [workflowMeta, setWorkflowMeta] = useState({
    blockedReason: '',
    nextCheckAt: '',
    evidenceLinks: '',
    notes: '',
  });

  useEffect(() => {
    if (!task || !open) return;
    setLoadingDoc(true);
    getTaskContextDoc(task.id)
      .then((res) => {
        setDocExists(res.exists);
        setDocPath(res.path);
      })
      .finally(() => setLoadingDoc(false));

    setContextForm((prev) => ({
      ...prev,
      objective: prev.objective || task.title,
      currentState: prev.currentState || (task.description || ''),
      nextActions: prev.nextActions || '- [ ] Define next implementation step',
      definitionOfDone: prev.definitionOfDone || '- [ ] Acceptance criteria met',
    }));

    const meta = getTaskWorkflowMeta(task.id);
    setWorkflowMeta({
      blockedReason: meta.blockedReason || '',
      nextCheckAt: meta.nextCheckAt ? new Date(meta.nextCheckAt).toISOString().slice(0, 16) : '',
      evidenceLinks: (meta.evidenceLinks || []).join('\n'),
      notes: meta.notes || '',
    });
  }, [task?.id, open]);

  const saveContextDoc = async () => {
    if (!task) return;
    const required = [
      contextForm.objective,
      contextForm.briefPath,
      contextForm.prdPath,
      contextForm.taskListPath,
      contextForm.definitionOfDone,
      contextForm.currentState,
      contextForm.nextActions,
    ];
    if (required.some((v) => !v.trim())) {
      toast.error('Fill all execution context fields before saving.');
      return;
    }

    setSavingDoc(true);
    try {
      const res = await createTaskContextDoc({
        taskId: task.id,
        title: task.title,
        objective: contextForm.objective.trim(),
        briefPath: contextForm.briefPath.trim(),
        prdPath: contextForm.prdPath.trim(),
        taskListPath: contextForm.taskListPath.trim(),
        definitionOfDone: contextForm.definitionOfDone.trim(),
        currentState: contextForm.currentState.trim(),
        nextActions: contextForm.nextActions.trim(),
        assignee: task.assignee,
        priority: task.priority,
      });
      setDocExists(true);
      setDocPath(res.path);
      toast.success('Task context doc saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save context doc');
    } finally {
      setSavingDoc(false);
    }
  };

  const saveWorkflowMeta = () => {
    if (!task) return;
    const evidenceLinks = workflowMeta.evidenceLinks
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setTaskWorkflowMeta(task.id, {
      blockedReason: workflowMeta.blockedReason.trim() || undefined,
      nextCheckAt: workflowMeta.nextCheckAt ? new Date(workflowMeta.nextCheckAt).getTime() : undefined,
      evidenceLinks,
      notes: workflowMeta.notes.trim() || undefined,
    });
    toast.success('Workflow metadata saved');
  };


  if (!task) return null;

  const priority = task.priority || 'medium';
  const priorityConfig = PRIORITY_CONFIG[priority];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showOverlay={false} className="w-full sm:max-w-lg flex flex-col overflow-y-auto overscroll-contain">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-lg leading-tight pr-6">{task.title}</SheetTitle>
          <SheetDescription className="sr-only">Task details and comments</SheetDescription>
        </SheetHeader>

        {/* Task Details */}
        <div className="flex-shrink-0 px-4 space-y-3">
          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className={`text-xs px-2 py-0.5 border-0 ${LABEL_COLORS[label] || 'bg-muted text-muted-foreground'}`}
                >
                  {label}
                </Badge>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {/* Priority */}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${priorityConfig.bg} ${priorityConfig.color}`}>
              {priorityConfig.icon}
              {priorityConfig.label}
            </span>

            {/* Column */}
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-muted capitalize">
              {task.column}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}

            {/* Assignee */}
            {task.assignee && (
              <span className="inline-flex items-center gap-1 text-xs">
                <User className="h-3 w-3" />
                {task.assignee}
              </span>
            )}
          </div>

          <div className="rounded-md border bg-muted/30 px-2.5 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Project ID</div>
            <code className="block text-xs font-mono text-foreground break-all select-all">{task.id}</code>
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Execution Context
              </div>
              <Badge variant={docExists ? 'default' : 'destructive'}>{loadingDoc ? 'Checking...' : docExists ? 'Ready' : 'Missing'}</Badge>
            </div>

            {docPath && <p className="text-[11px] text-muted-foreground break-all">{docPath}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="Brief path" value={contextForm.briefPath} onChange={(e) => setContextForm((p) => ({ ...p, briefPath: e.target.value }))} />
              <Input placeholder="PRD path" value={contextForm.prdPath} onChange={(e) => setContextForm((p) => ({ ...p, prdPath: e.target.value }))} />
              <Input placeholder="Task list path" value={contextForm.taskListPath} onChange={(e) => setContextForm((p) => ({ ...p, taskListPath: e.target.value }))} className="sm:col-span-2" />
            </div>

            <Textarea placeholder="Objective" rows={2} value={contextForm.objective} onChange={(e) => setContextForm((p) => ({ ...p, objective: e.target.value }))} />
            <Textarea placeholder="Definition of done" rows={2} value={contextForm.definitionOfDone} onChange={(e) => setContextForm((p) => ({ ...p, definitionOfDone: e.target.value }))} />
            <Textarea placeholder="Current state" rows={2} value={contextForm.currentState} onChange={(e) => setContextForm((p) => ({ ...p, currentState: e.target.value }))} />
            <Textarea placeholder="Next actions" rows={2} value={contextForm.nextActions} onChange={(e) => setContextForm((p) => ({ ...p, nextActions: e.target.value }))} />

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={saveContextDoc} disabled={savingDoc}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> {savingDoc ? 'Saving...' : docExists ? 'Regenerate Doc' : 'Create Doc'}
              </Button>
              {docExists && (
                <Button type="button" size="sm" variant="outline" onClick={() => window.open(`/api/task-context-doc?taskId=${encodeURIComponent(task.id)}&raw=1`, '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open Doc
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Workflow Metadata</div>
              <Badge variant="secondary">Local</Badge>
            </div>

            <Textarea
              placeholder="Blocked reason (optional)"
              rows={2}
              value={workflowMeta.blockedReason}
              onChange={(e) => setWorkflowMeta((p) => ({ ...p, blockedReason: e.target.value }))}
            />
            <Input
              type="datetime-local"
              value={workflowMeta.nextCheckAt}
              onChange={(e) => setWorkflowMeta((p) => ({ ...p, nextCheckAt: e.target.value }))}
            />
            <Textarea
              placeholder="Evidence links (one per line)"
              rows={3}
              value={workflowMeta.evidenceLinks}
              onChange={(e) => setWorkflowMeta((p) => ({ ...p, evidenceLinks: e.target.value }))}
            />
            <Button type="button" size="sm" variant="outline" onClick={saveWorkflowMeta}>Save Workflow Metadata</Button>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        <Separator className="flex-shrink-0" />

        {/* Notes Section */}
        <Separator className="flex-shrink-0" />
        <div className="px-4 py-3">
          <h3 className="text-sm font-medium mb-2">Notes</h3>
          <Textarea
            placeholder="Working notes for this project"
            rows={8}
            value={workflowMeta.notes}
            onChange={(e) => setWorkflowMeta((p) => ({ ...p, notes: e.target.value }))}
          />
          <div className="mt-2">
            <Button type="button" size="sm" variant="outline" onClick={saveWorkflowMeta}>Save Notes</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
