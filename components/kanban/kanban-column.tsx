'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Task, KanbanColumn as ColumnType } from '@/types';
import { TaskCard } from './task-card';
import { AddTaskDialog } from './add-task-dialog';
import { useState, useEffect } from 'react';

interface KanbanColumnProps {
  id: ColumnType;
  title: string;
  color: string;
  bgColor: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const COLUMN_DOT_COLORS: Record<ColumnType, string> = {
  backlog: 'bg-slate-400',
  todo: 'bg-blue-500',
  'in-progress': 'bg-amber-500',
  review: 'bg-purple-500',
  done: 'bg-emerald-500',
};

export function KanbanColumn({ id, title, tasks, onTaskClick }: KanbanColumnProps) {
  const [mounted, setMounted] = useState(false);
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border transition-all duration-200 ease-out ${
        isOver
          ? 'border-primary/50 bg-primary/[0.02] shadow-lg ring-1 ring-primary/10'
          : 'border-border/40 bg-card/50'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${COLUMN_DOT_COLORS[id]}`} />
          <h3 className="font-medium text-sm text-foreground">{title}</h3>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
            {mounted ? tasks.length : 0}
          </span>
        </div>
        <AddTaskDialog defaultColumn={id} variant="column" />
      </div>

      {/* Tasks Container */}
      <div className={`flex-1 px-2 pb-2 space-y-2 min-h-[80px] transition-colors duration-200 ${
        isOver ? 'bg-primary/[0.02]' : ''
      }`}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
        ))}
        {isOver && tasks.length === 0 && (
          <div className="h-20 rounded-lg border-2 border-dashed border-primary/30 bg-primary/[0.03] flex items-center justify-center">
            <span className="text-xs text-primary/50">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
}
