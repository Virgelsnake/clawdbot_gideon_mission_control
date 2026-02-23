'use client';

import { useState } from 'react';
import { useTask } from '@/contexts/task-context';
import { useSettings } from '@/contexts/settings-context';
import { Button } from '@/components/ui/button';
import { Plus, Flag, Calendar, User, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { KanbanColumn, TaskPriority } from '@/types';
import { createTaskContextDoc } from '@/lib/task-context-doc-client';
import { toast } from 'sonner';

interface AddTaskDialogProps {
  defaultColumn?: KanbanColumn;
  variant?: 'header' | 'column';
}

const COLUMNS: { id: KanbanColumn; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

const PRIORITIES: { id: TaskPriority; label: string; color: string }[] = [
  { id: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
  { id: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

export function AddTaskDialog({ defaultColumn = 'backlog', variant = 'header' }: AddTaskDialogProps) {
  const { addTask } = useTask();
  const { settings } = useSettings();

  const gideonLabel = settings.labels.find((l) => l.name.toLowerCase() === 'gideon');
  const defaultLabels = gideonLabel ? [gideonLabel.name] : [];

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [column, setColumn] = useState<KanbanColumn>(defaultColumn);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(defaultLabels);

  const [objective, setObjective] = useState('');
  const [briefPath, setBriefPath] = useState('');
  const [prdPath, setPrdPath] = useState('');
  const [taskListPath, setTaskListPath] = useState('');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [nextActions, setNextActions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setColumn(defaultColumn);
    setPriority('medium');
    setAssignee('');
    setDueDate('');
    setSelectedLabels(defaultLabels);
    setObjective('');
    setBriefPath('');
    setPrdPath('');
    setTaskListPath('');
    setDefinitionOfDone('');
    setCurrentState('');
    setNextActions('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    const requiredDocFields = [objective, briefPath, prdPath, taskListPath, definitionOfDone, currentState, nextActions];
    if (requiredDocFields.some((f) => !f.trim())) {
      toast.error('Execution docs are required before project creation.');
      return;
    }

    setSubmitting(true);
    try {
      const project = await addTask(
        title.trim(),
        description.trim() || undefined,
        column,
        priority,
        assignee.trim() || undefined,
        dueDate ? new Date(dueDate).getTime() : undefined,
        selectedLabels.length > 0 ? selectedLabels : undefined
      );

      await createTaskContextDoc({
        taskId: project.id,
        title: project.title,
        objective: objective.trim(),
        briefPath: briefPath.trim(),
        prdPath: prdPath.trim(),
        taskListPath: taskListPath.trim(),
        definitionOfDone: definitionOfDone.trim(),
        currentState: currentState.trim(),
        nextActions: nextActions.trim(),
        assignee: assignee.trim() || undefined,
        priority,
      });

      resetForm();
      setOpen(false);
      toast.success(`Project created with execution doc (${project.id})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'column' ? (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new project to your board. Execution docs are required.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium">Project Title <span className="text-destructive">*</span></Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" required className="h-10" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more details about this task..." rows={3} />
            </div>

            <div className="grid gap-2 rounded-lg border border-border/60 p-3">
              <Label htmlFor="objective" className="text-sm font-medium">Objective <span className="text-destructive">*</span></Label>
              <Textarea id="objective" value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} required />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="grid gap-1.5"><Label htmlFor="briefPath" className="text-xs">Brief path *</Label><Input id="briefPath" value={briefPath} onChange={(e) => setBriefPath(e.target.value)} required /></div>
                <div className="grid gap-1.5"><Label htmlFor="prdPath" className="text-xs">PRD path *</Label><Input id="prdPath" value={prdPath} onChange={(e) => setPrdPath(e.target.value)} required /></div>
                <div className="grid gap-1.5"><Label htmlFor="taskListPath" className="text-xs">Task list path *</Label><Input id="taskListPath" value={taskListPath} onChange={(e) => setTaskListPath(e.target.value)} required /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="grid gap-1.5"><Label htmlFor="definitionOfDone" className="text-xs">Definition of done *</Label><Textarea id="definitionOfDone" value={definitionOfDone} onChange={(e) => setDefinitionOfDone(e.target.value)} rows={2} required /></div>
                <div className="grid gap-1.5"><Label htmlFor="currentState" className="text-xs">Current state *</Label><Textarea id="currentState" value={currentState} onChange={(e) => setCurrentState(e.target.value)} rows={2} required /></div>
                <div className="grid gap-1.5"><Label htmlFor="nextActions" className="text-xs">Next actions *</Label><Textarea id="nextActions" value={nextActions} onChange={(e) => setNextActions(e.target.value)} rows={2} required /></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="column" className="text-sm font-medium flex items-center gap-2"><Flag className="h-3.5 w-3.5" />Status</Label>
                <Select value={column} onValueChange={(v) => setColumn(v as KanbanColumn)}>
                  <SelectTrigger id="column"><SelectValue /></SelectTrigger>
                  <SelectContent>{COLUMNS.map((col) => (<SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>))}</SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority" className="text-sm font-medium flex items-center gap-2"><Flag className="h-3.5 w-3.5" />Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.id} value={p.id}><div className="flex items-center gap-2"><span className={`inline-block w-2 h-2 rounded-full ${p.color.split(' ')[1].replace('text-', 'bg-')}`} />{p.label}</div></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignee" className="text-sm font-medium flex items-center gap-2"><User className="h-3.5 w-3.5" />Assignee</Label>
                {settings.teamMembers.length > 0 ? (
                  <Select value={assignee} onValueChange={(v) => setAssignee(v === 'unassigned' ? '' : v)}>
                    <SelectTrigger id="assignee"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {settings.teamMembers.map((m) => (<SelectItem key={m.id} value={m.name}><div className="flex items-center gap-2"><span className="h-4 w-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: m.color }}>{m.initials}</span>{m.name}</div></SelectItem>))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Name" className="h-10" />
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dueDate" className="text-sm font-medium flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />Due Date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium flex items-center gap-2"><Tag className="h-3.5 w-3.5" />Labels</Label>
              <div className="flex flex-wrap gap-2">
                {settings.labels.map((label) => (
                  <button key={label.id} type="button" onClick={() => toggleLabel(label.name)} className="px-2.5 py-1 text-xs font-medium rounded-full border transition-all capitalize" style={selectedLabels.includes(label.name) ? { backgroundColor: label.color + '20', color: label.color, borderColor: label.color } : undefined}>
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || submitting}>{submitting ? 'Creating...' : 'Create Project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
