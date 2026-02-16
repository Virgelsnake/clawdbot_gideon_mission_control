'use client';

import { useDraggable } from '@dnd-kit/core';
import { useTask } from '@/contexts/task-context';
import { Lightbulb, GripVertical, Trash2 } from 'lucide-react';
import { AddIdeaDialog } from './add-idea-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

function formatDate(timestamp: number): string {
  // Use fixed format to avoid hydration mismatches
  const date = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function IdeaCard({ idea }: { idea: { id: string; content: string; createdAt: number } }) {
  const { deleteIdea } = useTask();
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    isDragging 
  } = useDraggable({
    id: idea.id,
    data: { type: 'idea', idea },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteIdea(idea.id);
    toast.success('Idea deleted', { icon: '🗑️' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative rounded-md border border-border bg-card p-2.5 shadow-sm cursor-grab active:cursor-grabbing",
        "transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        isDragging && "opacity-0 cursor-grabbing"
      )}
    >
      <div className="flex gap-2">
        <div className="text-muted-foreground flex-shrink-0 mt-0.5">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs leading-relaxed line-clamp-3">{idea.content}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">
              {formatDate(idea.createdAt)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-5 sm:w-5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              title="Delete idea"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IdeasPanelProps {
  mobile?: boolean;
}

export function IdeasPanel({ mobile }: IdeasPanelProps) {
  const { ideas, loading } = useTask();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className={mobile ? "flex h-full flex-col bg-background" : "flex h-full flex-col border-r border-border/50 bg-muted/20 w-72"}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <h2 className="text-sm font-medium">Ideas</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {mounted ? ideas.length : 0}
          </span>
          <AddIdeaDialog />
        </div>
      </div>

      {/* Ideas List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!mounted || loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-2.5">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-12 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Lightbulb className="h-10 w-10 text-yellow-500/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No ideas yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Capture quick thoughts here</p>
          </div>
        ) : (
          ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
        )}
      </div>
    </div>
  );
}
