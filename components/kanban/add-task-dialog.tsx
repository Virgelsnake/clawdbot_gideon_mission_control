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
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [column, setColumn] = useState<KanbanColumn>(defaultColumn);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const { addTask } = useTask();
  const { settings } = useSettings();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (title.trim()) {
      addTask(
        title.trim(),
        description.trim() || undefined,
        column,
        priority,
        assignee.trim() || undefined,
        dueDate ? new Date(dueDate).getTime() : undefined,
        selectedLabels.length > 0 ? selectedLabels : undefined
      );
      // Reset form
      setTitle('');
      setDescription('');
      setColumn(defaultColumn);
      setPriority('medium');
      setAssignee('');
      setDueDate('');
      setSelectedLabels([]);
      setOpen(false);
    }
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
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
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your board. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Task Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                className="h-10"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this task..."
                rows={3}
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Column Selection */}
              <div className="grid gap-2">
                <Label htmlFor="column" className="text-sm font-medium flex items-center gap-2">
                  <Flag className="h-3.5 w-3.5" />
                  Status
                </Label>
                <Select value={column} onValueChange={(v) => setColumn(v as KanbanColumn)}>
                  <SelectTrigger id="column">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="grid gap-2">
                <Label htmlFor="priority" className="text-sm font-medium flex items-center gap-2">
                  <Flag className="h-3.5 w-3.5" />
                  Priority
                </Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${p.color.split(' ')[1].replace('text-', 'bg-')}`} />
                          {p.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Two Column Layout - Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              {/* Assignee */}
              <div className="grid gap-2">
                <Label htmlFor="assignee" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  Assignee
                </Label>
                {settings.teamMembers.length > 0 ? (
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {settings.teamMembers.map(m => (
                        <SelectItem key={m.id} value={m.name}>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                              style={{ backgroundColor: m.color }}
                            >
                              {m.initials}
                            </span>
                            {m.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="assignee"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    placeholder="Name"
                    className="h-10"
                  />
                )}
              </div>

              {/* Due Date */}
              <div className="grid gap-2">
                <Label htmlFor="dueDate" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {/* Labels */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" />
                Labels
              </Label>
              <div className="flex flex-wrap gap-2">
                {settings.labels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.name)}
                    className="px-2.5 py-1 text-xs font-medium rounded-full border transition-all capitalize"
                    style={
                      selectedLabels.includes(label.name)
                        ? { backgroundColor: label.color + '20', color: label.color, borderColor: label.color }
                        : undefined
                    }
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
