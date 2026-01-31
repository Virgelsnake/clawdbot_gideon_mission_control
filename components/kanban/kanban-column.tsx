'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Task, KanbanColumn as ColumnType } from '@/types';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface KanbanColumnProps {
  id: ColumnType;
  title: string;
  color: string;
  bgColor: string;
  tasks: Task[];
}

export function KanbanColumn({ id, title, color, bgColor, tasks }: KanbanColumnProps) {
  const [mounted, setMounted] = useState(false);
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border bg-card transition-all duration-200 ease-out ${
        isOver ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-border/50'
      }`}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between p-3 rounded-t-xl ${bgColor}`}>
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold text-sm ${color}`}>{title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/20 ${color}`}>
            {mounted ? tasks.length : 0}
          </span>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 p-3 space-y-3 min-h-[100px] bg-muted/20">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* Add Task Button */}
      <div className="p-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
