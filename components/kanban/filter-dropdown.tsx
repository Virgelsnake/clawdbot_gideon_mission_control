'use client';

import { useTask } from '@/contexts/task-context';
import { useSettings } from '@/contexts/settings-context';
import type { TaskPriority, DueDateFilter } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Filter, Search, X, Calendar, Flag, User, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITIES: { id: TaskPriority; label: string; color: string }[] = [
  { id: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'high', label: 'High', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' },
];


const DUE_DATE_OPTIONS: { value: DueDateFilter; label: string }[] = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'no-date', label: 'No Due Date' },
];

export function FilterDropdown() {
  const { filters, setFilter, clearFilters } = useTask();
  const { settings } = useSettings();

  const hasActiveFilters =
    filters.search ||
    filters.priorities.length > 0 ||
    filters.assignee ||
    filters.labels.length > 0 ||
    filters.dueDateFilter;

  const togglePriority = (priority: TaskPriority) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    setFilter('priorities', newPriorities);
  };

  const toggleLabel = (label: string) => {
    const newLabels = filters.labels.includes(label)
      ? filters.labels.filter(l => l !== label)
      : [...filters.labels, label];
    setFilter('labels', newLabels);
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.priorities.length +
    (filters.assignee ? 1 : 0) +
    filters.labels.length +
    (filters.dueDateFilter ? 1 : 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-semibold">Filter Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Search */}
        <div className="p-3 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Search className="h-3 w-3" />
              Search
            </Label>
            <Input
              placeholder="Search title or description..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Flag className="h-3 w-3" />
              Priority
            </Label>
            <div className="flex flex-wrap gap-1">
              {PRIORITIES.map(priority => (
                <button
                  key={priority.id}
                  onClick={() => togglePriority(priority.id)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md border transition-all',
                    filters.priorities.includes(priority.id)
                      ? priority.color
                      : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                  )}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <User className="h-3 w-3" />
              Assignee
            </Label>
            {settings.teamMembers.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {settings.teamMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => setFilter('assignee', filters.assignee === member.name ? '' : member.name)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-md border transition-all flex items-center gap-1.5',
                      filters.assignee === member.name
                        ? 'border-current'
                        : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                    )}
                    style={filters.assignee === member.name ? { backgroundColor: member.color + '20', color: member.color, borderColor: member.color } : undefined}
                  >
                    <span
                      className="h-4 w-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initials}
                    </span>
                    {member.name}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                placeholder="Filter by assignee..."
                value={filters.assignee}
                onChange={e => setFilter('assignee', e.target.value)}
                className="h-8 text-sm"
              />
            )}
          </div>

          {/* Labels */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Labels
            </Label>
            <div className="flex flex-wrap gap-1">
              {settings.labels.map(label => (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.name)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md border transition-all capitalize',
                    filters.labels.includes(label.name)
                      ? 'border-current'
                      : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                  )}
                  style={filters.labels.includes(label.name) ? { backgroundColor: label.color + '20', color: label.color, borderColor: label.color } : undefined}
                >
                  {label.name}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Due Date
            </Label>
            <div className="flex flex-wrap gap-1">
              {DUE_DATE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() =>
                    setFilter(
                      'dueDateFilter',
                      filters.dueDateFilter === option.value ? null : option.value
                    )
                  }
                  className={cn(
                    'px-2 py-1 text-xs rounded-md border transition-all',
                    filters.dueDateFilter === option.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Clear All */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
