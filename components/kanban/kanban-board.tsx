'use client';

import { useTask } from '@/contexts/task-context';
import { AddTaskDialog } from './add-task-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Filter,
  SortAsc,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { KanbanColumn as ColumnType } from '@/types';
import { KanbanColumn } from './kanban-column';
import { useState, useEffect } from 'react';

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
  const { tasks } = useTask();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.column === 'done').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Board Header */}
      <div className="flex flex-col gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Board View</h2>
            <Badge variant="secondary" className="font-normal">
              {mounted ? totalTasks : 0} tasks
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <SortAsc className="h-4 w-4" />
              Sort
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Button variant="outline" size="icon" className="h-8 w-8">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <List className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <AddTaskDialog />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Project Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{mounted ? completedTasks : 0} completed</span>
            <span>•</span>
            <span>{mounted ? totalTasks - completedTasks : 0} remaining</span>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="flex flex-1 gap-4 overflow-x-auto px-6 py-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            bgColor={column.bgColor}
            tasks={tasks.filter((task) => task.column === column.id)}
          />
        ))}
      </div>
    </div>
  );
}
