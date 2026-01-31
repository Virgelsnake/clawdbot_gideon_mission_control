'use client';

import { DndContext, DragEndEvent, useSensor, useSensors, MouseSensor, DragStartEvent, closestCorners, DragOverlay } from '@dnd-kit/core';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { IdeasPanel } from '@/components/ideas/ideas-panel';
import { useTask } from '@/contexts/task-context';
import { useState, useEffect } from 'react';
import { ConvertIdeaDialog } from '@/components/ideas/convert-idea-dialog';
import type { KanbanColumn as ColumnType, Idea } from '@/types';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function KanbanContent() {
  const { tasks, moveTask, ideas } = useTask();
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [ideaToConvert, setIdeaToConvert] = useState<{ idea: Idea; column: ColumnType } | null>(null);
  const [activeIdea, setActiveIdea] = useState<Idea | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log('DragStart:', active.id);
    
    if (active.data.current?.type === 'idea') {
      setActiveIdea(active.data.current.idea as Idea);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('DragEnd - active:', active.id);
    console.log('DragEnd - over:', over?.id);
    
    setActiveIdea(null);

    if (!over) {
      console.log('DragEnd - no drop target');
      return;
    }

    const toColumn = over.id as ColumnType;

    // Check if dragging an idea by checking the data type
    if (active.data.current?.type === 'idea') {
      const idea = active.data.current.idea as Idea;
      console.log('DragEnd - converting idea:', idea.id, 'to column:', toColumn);
      setIdeaToConvert({ idea, column: toColumn });
      setConvertDialogOpen(true);
      return;
    }

    // Handle task movement - active.id is the task id
    const activeId = active.id as string;
    const task = tasks.find((t) => t.id === activeId);
    if (task && task.column !== toColumn) {
      moveTask(activeId, toColumn);
    }
  };

  // Prevent hydration mismatch by not rendering DndContext until client-side
  if (!isClient) {
    return (
      <div className="flex h-full">
        <IdeasPanel />
        <div className="flex-1">
          <KanbanBoard />
        </div>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full">
        <IdeasPanel />
        <div className="flex-1">
          <KanbanBoard />
        </div>
      </div>
      
      {/* Drag Overlay - renders dragged item above everything */}
      <DragOverlay dropAnimation={null}>
        {activeIdea ? (
          <div className="rounded-md border border-primary bg-card p-2.5 shadow-lg cursor-grabbing ring-2 ring-primary/50 w-64 rotate-2">
            <div className="flex gap-2">
              <div className="text-muted-foreground flex-shrink-0 mt-0.5">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed line-clamp-3">{activeIdea.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(activeIdea.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
      
      {/* Convert Idea Dialog */}
      {ideaToConvert && (
        <ConvertIdeaDialog
          key={ideaToConvert.idea.id}
          open={convertDialogOpen}
          onOpenChange={setConvertDialogOpen}
          ideaId={ideaToConvert.idea.id}
          ideaContent={ideaToConvert.idea.content}
          targetColumn={ideaToConvert.column}
        />
      )}
    </DndContext>
  );
}

export default function Home() {
  return <KanbanContent />;
}
