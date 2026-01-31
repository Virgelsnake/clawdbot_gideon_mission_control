'use client';

import { useState } from 'react';
import { useTask } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Plus, Lightbulb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const MAX_CHARS = 500;

export function AddIdeaDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const { addIdea } = useTask();

  const isOverLimit = content.length > MAX_CHARS;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed && !isOverLimit) {
      addIdea(trimmed);
      setContent('');
      setOpen(false);
      toast.success('Idea captured!', { icon: '💡' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Idea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Capture Idea
            </DialogTitle>
            <DialogDescription>
              Quickly capture your thoughts, feature requests, or anything that comes to mind.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="idea-content" className="text-sm font-medium">
                Your Idea <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="idea-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                required
                className={isOverLimit ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              <p className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                {content.length}/{MAX_CHARS} characters
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim() || isOverLimit}>
              Capture Idea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
