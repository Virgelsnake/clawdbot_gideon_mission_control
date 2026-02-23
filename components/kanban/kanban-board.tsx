'use client';

import { useTask } from '@/contexts/task-context';
import { AddTaskDialog } from './add-task-dialog';
import { FilterDropdown } from './filter-dropdown';
import { ActiveFilters } from './active-filters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  SortAsc,
  LayoutGrid,
  List,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanColumn as ColumnType, Task } from '@/types';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { TaskList } from './task-list';
import { TaskDetailDialog } from './task-detail-dialog';
import { useState, useEffect, useCallback } from 'react';
import { useUI } from '@/contexts/ui-context';
import { hasTaskContextDoc } from '@/lib/task-context-doc-client';
import { getTaskWorkflowMeta } from '@/lib/task-workflow-meta';

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

interface KanbanBoardProps {
  mobile?: boolean;
}

export function KanbanBoard({ mobile }: KanbanBoardProps) {
  const { tasks, filteredTasks, loading, filters, setFilter } = useTask();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [mobileColumn, setMobileColumn] = useState<ColumnType>('todo');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [missingDocCount, setMissingDocCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [staleCount, setStaleCount] = useState(0);
  const { setTaskDetailOpen } = useUI();

  // Sync task detail state with UI context
  useEffect(() => {
    setTaskDetailOpen(detailOpen);
  }, [detailOpen, setTaskDetailOpen]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    async function computeWidgets() {
      const inProgress = tasks.filter((t) => t.column === 'in-progress');
      const now = Date.now();
      const stale = inProgress.filter((t) => now - t.updatedAt > 24 * 60 * 60 * 1000).length;
      const blocked = inProgress.filter((t) => {
        const meta = getTaskWorkflowMeta(t.id);
        return Boolean(meta.blockedReason && meta.blockedReason.trim());
      }).length;

      let missing = 0;
      for (const task of inProgress) {
        // eslint-disable-next-line no-await-in-loop
        const hasDoc = await hasTaskContextDoc(task.id);
        if (!hasDoc) missing += 1;
      }

      if (!active) return;
      setStaleCount(stale);
      setBlockedCount(blocked);
      setMissingDocCount(missing);
    }

    computeWidgets();
    return () => {
      active = false;
    };
  }, [tasks]);

  const totalTasks = tasks.length;
  const filteredCount = filteredTasks.length;
  const completedTasks = tasks.filter((t) => t.column === 'done').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const COLUMN_DOT_COLORS: Record<ColumnType, string> = {
    backlog: 'bg-slate-400',
    todo: 'bg-blue-500',
    'in-progress': 'bg-amber-500',
    review: 'bg-purple-500',
    done: 'bg-emerald-500',
  };

  // Mobile view: column selector tabs + single-column card list
  if (mobile) {
    const mobileColumnTasks = filteredTasks.filter((t) => t.column === mobileColumn);
    const activeCol = COLUMNS.find((c) => c.id === mobileColumn);

    return (
      <div className="flex h-full flex-col bg-background">
        {/* Mobile Header */}
        <div className="flex flex-col gap-2 border-b border-border/50 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Board</h2>
              <Badge variant="secondary" className="text-xs font-normal">
                {mounted ? filteredCount : 0}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <FilterDropdown />
              <AddTaskDialog />
            </div>
          </div>
          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="h-8 w-full pl-9 pr-8 text-sm"
            />
            {filters.search && (
              <button
                onClick={() => setFilter('search', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Column Selector Tabs */}
        <div className="flex border-b border-border/50 overflow-x-auto scrollbar-none">
          {COLUMNS.map((col) => {
            const count = filteredTasks.filter((t) => t.column === col.id).length;
            return (
              <button
                key={col.id}
                onClick={() => setMobileColumn(col.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                  mobileColumn === col.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground'
                )}
              >
                <div className={cn('w-1.5 h-1.5 rounded-full', COLUMN_DOT_COLORS[col.id])} />
                {col.title}
                <span className="text-[10px] text-muted-foreground">{mounted ? count : 0}</span>
              </button>
            );
          })}
        </div>

        {/* Task Cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-card p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex items-center gap-1.5 pt-1">
                    <Skeleton className="h-4 w-14 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : mobileColumnTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-sm text-muted-foreground">No tasks in {activeCol?.title}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Add a task to get started</p>
            </div>
          ) : (
            mobileColumnTasks.map((task) => (
              <TaskCard key={task.id} task={task} onTaskClick={handleTaskClick} />
            ))
          )}
        </div>
      </div>
    );
  }

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
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="h-8 w-64 pl-9 pr-8 text-sm"
              />
              {filters.search && (
                <button
                  onClick={() => setFilter('search', '')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
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
              variant="outline"
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

          {/* Workflow Visibility Widgets */}
          <div className="flex items-center gap-2 text-xs">
            <Badge variant={missingDocCount > 0 ? 'destructive' : 'secondary'}>Missing docs: {missingDocCount}</Badge>
            <Badge variant={blockedCount > 0 ? 'destructive' : 'secondary'}>Blocked: {blockedCount}</Badge>
            <Badge variant={staleCount > 0 ? 'destructive' : 'secondary'}>Stale &gt;24h: {staleCount}</Badge>
          </div>
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
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      ) : (
        <TaskList onTaskClick={handleTaskClick} />
      )}

      <TaskDetailDialog
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
