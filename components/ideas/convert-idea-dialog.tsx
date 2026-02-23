'use client';

import { useState } from 'react';
import { useTask } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Flag, Calendar, User, Tag, Lightbulb, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner';
import { createTaskContextDoc } from '@/lib/task-context-doc-client';

interface ConvertIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  ideaContent: string;
  targetColumn?: KanbanColumn;
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

const AVAILABLE_LABELS = ['bug', 'feature', 'enhancement', 'docs', 'design', 'research'];

const LABEL_COLORS: Record<string, string> = {
  bug: 'bg-red-100 text-red-700 border-red-200',
  feature: 'bg-blue-100 text-blue-700 border-blue-200',
  enhancement: 'bg-purple-100 text-purple-700 border-purple-200',
  docs: 'bg-green-100 text-green-700 border-green-200',
  design: 'bg-pink-100 text-pink-700 border-pink-200',
  research: 'bg-amber-100 text-amber-700 border-amber-200',
};

export function ConvertIdeaDialog({
  open,
  onOpenChange,
  ideaId,
  ideaContent,
  targetColumn = 'backlog',
}: ConvertIdeaDialogProps) {
  const [title, setTitle] = useState(ideaContent);
  const [description, setDescription] = useState('');
  const [column, setColumn] = useState<KanbanColumn>(targetColumn);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [objective, setObjective] = useState('');
  const [briefPath, setBriefPath] = useState('');
  const [prdPath, setPrdPath] = useState('');
  const [taskListPath, setTaskListPath] = useState('');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [nextActions, setNextActions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addTask, archiveIdea } = useTask();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    const requiredDocFields = [objective, briefPath, prdPath, taskListPath, definitionOfDone, currentState, nextActions];
    if (requiredDocFields.some((f) => !f.trim())) {
      toast.error('Execution docs are required before converting to task.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addTask(
        title.trim(),
        description.trim() || undefined,
        column,
        priority,
        assignee.trim() || undefined,
        dueDate ? new Date(dueDate).getTime() : undefined,
        selectedLabels.length > 0 ? selectedLabels : undefined
      );

      await createTaskContextDoc({
        taskId: created.id,
        title: created.title,
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

      await archiveIdea(ideaId, created.id);

      setTitle('');
      setDescription('');
      setColumn('backlog');
      setPriority('medium');
      setAssignee('');
      setDueDate('');
      setSelectedLabels([]);
      setObjective('');
      setBriefPath('');
      setPrdPath('');
      setTaskListPath('');
      setDefinitionOfDone('');
      setCurrentState('');
      setNextActions('');
      onOpenChange(false);

      toast.success('Idea converted to task!', { icon: '🚀' });
    } catch {
      toast.error('Failed to convert idea to task');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              Convert to Task
            </DialogTitle>
            <DialogDescription>
              Add details to convert this idea into a task. Execution docs are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium">Task Title <span className="text-destructive">*</span></Label>
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
                <Input id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Name" className="h-10" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dueDate" className="text-sm font-medium flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />Due Date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium flex items-center gap-2"><Tag className="h-3.5 w-3.5" />Labels</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LABELS.map((label) => (
                  <button key={label} type="button" onClick={() => toggleLabel(label)} className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${selectedLabels.includes(label) ? LABEL_COLORS[label] : 'bg-muted text-muted-foreground border-transparent hover:border-border'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || submitting}>{submitting ? 'Creating...' : 'Create Task'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
