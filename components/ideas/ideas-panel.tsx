'use client';

import { useState } from 'react';
import { useTask } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lightbulb, Plus, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function IdeasPanel() {
  const { ideas, addIdea, deleteIdea, promoteIdea } = useTask();
  const [newIdea, setNewIdea] = useState('');

  const handleAddIdea = () => {
    if (newIdea.trim()) {
      addIdea(newIdea.trim());
      setNewIdea('');
      toast.success('Idea added');
    }
  };

  const handlePromote = (id: string, content: string) => {
    promoteIdea(id);
    toast.success(`Promoted "${content}" to backlog`);
  };

  const handleDelete = (id: string) => {
    deleteIdea(id);
    toast.success('Idea deleted');
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-muted/30 w-80">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h2 className="font-semibold">Ideas</h2>
        </div>
        <span className="text-xs text-muted-foreground">{ideas.length}</span>
      </div>

      {/* Quick Add */}
      <div className="border-b border-border p-4">
        <div className="flex gap-2">
          <Input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Quick add idea..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddIdea()}
          />
          <Button size="icon" onClick={handleAddIdea} disabled={!newIdea.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ideas List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ideas.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No ideas yet</p>
            <p className="text-xs mt-1">Capture your ideas here</p>
          </div>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              className="group rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              tabIndex={0}
            >
              <p className="text-sm">{idea.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(idea.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handlePromote(idea.id, idea.content)}
                    title="Promote to task"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(idea.id)}
                    title="Delete idea"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
