'use client';

import { useTask } from '@/contexts/task-context';
import type { TaskPriority, DueDateFilter } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const DUE_DATE_LABELS: Record<Exclude<DueDateFilter, null>, string> = {
  overdue: 'Overdue',
  today: 'Due Today',
  'this-week': 'This Week',
  'no-date': 'No Due Date',
};

export function ActiveFilters() {
  const { filters, setFilter, clearFilters } = useTask();

  const hasActiveFilters =
    filters.search ||
    filters.priorities.length > 0 ||
    filters.assignee ||
    filters.labels.length > 0 ||
    filters.dueDateFilter;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.search && (
        <Badge variant="secondary" className="gap-1 pl-2 pr-1">
          Search: {filters.search}
          <button
            onClick={() => setFilter('search', '')}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            title="Remove search filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.priorities.map(priority => (
        <Badge
          key={priority}
          variant="secondary"
          className={cn(
            'gap-1 pl-2 pr-1',
            priority === 'low' && 'bg-slate-100 text-slate-700',
            priority === 'medium' && 'bg-blue-100 text-blue-700',
            priority === 'high' && 'bg-amber-100 text-amber-700',
            priority === 'urgent' && 'bg-red-100 text-red-700'
          )}
        >
          Priority: {PRIORITY_LABELS[priority]}
          <button
            onClick={() =>
              setFilter(
                'priorities',
                filters.priorities.filter(p => p !== priority)
              )
            }
            className="ml-1 rounded-full p-0.5 hover:bg-black/10"
            title={`Remove ${PRIORITY_LABELS[priority]} priority filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {filters.assignee && (
        <Badge variant="secondary" className="gap-1 pl-2 pr-1">
          Assignee: {filters.assignee}
          <button
            onClick={() => setFilter('assignee', '')}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            title="Remove assignee filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.labels.map(label => (
        <Badge key={label} variant="secondary" className="gap-1 pl-2 pr-1 capitalize">
          Label: {label}
          <button
            onClick={() =>
              setFilter(
                'labels',
                filters.labels.filter(l => l !== label)
              )
            }
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            title={`Remove ${label} label filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {filters.dueDateFilter && (
        <Badge variant="secondary" className="gap-1 pl-2 pr-1">
          {DUE_DATE_LABELS[filters.dueDateFilter]}
          <button
            onClick={() => setFilter('dueDateFilter', null)}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            title="Remove due date filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs text-muted-foreground hover:text-foreground"
        onClick={clearFilters}
      >
        Clear All
      </Button>
    </div>
  );
}
