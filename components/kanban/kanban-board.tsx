'use client';

import { useTask } from '@/contexts/task-context';
import { AddTaskDialog } from './add-task-dialog';
import { FilterDropdown } from './filter-dropdown';
import { ActiveFilters } from './active-filters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SortAsc,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { KanbanColumn as ColumnType } from '@/types';
import { KanbanColumn } from './kanban-column';
import { TaskList } from './task-list';
import { useState, useEffect } from 'react';

type ViewMode = 'board' | 'list';

const COLUMNS: {
  id: ColumnType;
  title: string;
  color: string;
  bgColor: string;
}[] = [
  { id: 'backlog', title: 'Backlog', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  { id: 'todo', title: 'To Do', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'in-progress', title: 'In Progress', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { id: 'review', title: 'Review', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: 'done', title: 'Done', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
];

export function KanbanBoard() {
  const { tasks, filteredTasks, loading } = useTask();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const totalTasks = tasks.length;
  const filteredCount = filteredTasks.length;
  const completedTasks = tasks.filter((t) => t.column === 'done').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Board Header */}
      <div className="flex flex-col gap-3 border-b border-border/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold tracking-tight">{viewMode === 'board' ? 'Board' : 'List'}</h2>
            <Badge variant="secondary" className="font-normal">
              {mounted ? (
                <>
                  {filteredCount} {filteredCount !== totalTasks && `/ ${totalTasks}`} tasks
                </>
              ) : (
                '0 tasks'
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <FilterDropdown />
            {viewMode === 'board' && (
              <Button variant="outline" size="sm" className="gap-2">
                <SortAsc className="h-4 w-4" />
                Sort
              </Button>
            )}
            <div className="h-4 w-px bg-border mx-1" />
            <Button
              variant={viewMode === 'board' ? 'outline' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('board')}
              aria-label="Board view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'outline' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <AddTaskDialog />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Project Progress</span>
                <span>{mounted ? progress : 0}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${mounted ? progress : 0}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{mounted ? completedTasks : 0} completed</span>
              <span>•</span>
              <span>{mounted ? totalTasks - completedTasks : 0} remaining</span>
            </div>
          </div>

          {/* Active Filters */}
          <ActiveFilters />
        </div>
      </div>

      {/* View Content */}
      {loading ? (
        <div className="flex flex-1 gap-4 overflow-x-auto px-6 py-4">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex w-72 shrink-0 flex-col rounded-xl border border-border/40 bg-card/50">
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-4" />
                </div>
              </div>
              <div className="flex-1 px-2 pb-2 space-y-2">
                {Array.from({ length: column.id === 'backlog' ? 3 : column.id === 'todo' ? 2 : 1 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border/60 bg-card p-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <div className="flex items-center gap-1.5 pt-1">
                      <Skeleton className="h-4 w-14 rounded" />
                      <Skeleton className="h-4 w-16 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'board' ? (
        <div className="flex flex-1 gap-4 overflow-x-auto px-6 py-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              bgColor={column.bgColor}
              tasks={filteredTasks.filter((task) => task.column === column.id)}
            />
          ))}
        </div>
      ) : (
        <TaskList />
      )}
    </div>
  );
}
