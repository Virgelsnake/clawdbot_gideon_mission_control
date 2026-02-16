'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/contexts/settings-context';
import type { Task, TaskComment, TaskPriority } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Flag,
  AlertCircle,
  MessageSquare,
  Send,
  User,
} from 'lucide-react';
import {
  fetchComments,
  createComment,
  subscribeTaskComments,
} from '@/lib/supabase/task-comments';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  low: {
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    icon: <Flag className="h-3 w-3" />,
    label: 'Low',
  },
  medium: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    icon: <Flag className="h-3 w-3" />,
    label: 'Medium',
  },
  high: {
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    icon: <Flag className="h-3 w-3" />,
    label: 'High',
  },
  urgent: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/30',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Urgent',
  },
};

const LABEL_COLORS: Record<string, string> = {
  bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  feature: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  enhancement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  docs: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  research: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(timestamp);
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const { settings } = useSettings();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load comments when task changes
  useEffect(() => {
    if (!task || !open) {
      setComments([]);
      return;
    }

    setLoadingComments(true);
    fetchComments(task.id)
      .then((data) => {
        setComments(data);
        setTimeout(scrollToBottom, 100);
      })
      .finally(() => setLoadingComments(false));
  }, [task?.id, open, scrollToBottom]);

  // Realtime subscription for new comments
  useEffect(() => {
    if (!task || !open) return;

    const unsubscribe = subscribeTaskComments(task.id, (newComment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
      setTimeout(scrollToBottom, 100);
    });

    return unsubscribe;
  }, [task?.id, open, scrollToBottom]);

  const handleSubmitComment = async () => {
    if (!task || !newComment.trim() || submitting) return;

    setSubmitting(true);
    const author = settings.chat.displayName === 'You' ? 'steve' : settings.chat.displayName.toLowerCase();
    const result = await createComment(task.id, author, newComment.trim());
    if (result) {
      // Optimistic: the realtime subscription will also add it, but we add immediately
      setComments((prev) => {
        if (prev.some((c) => c.id === result.id)) return prev;
        return [...prev, result];
      });
      setNewComment('');
      setTimeout(scrollToBottom, 100);
    }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (!task) return null;

  const priority = task.priority || 'medium';
  const priorityConfig = PRIORITY_CONFIG[priority];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showOverlay={false} className="w-full sm:max-w-lg flex flex-col overflow-hidden">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-lg leading-tight pr-6">{task.title}</SheetTitle>
          <SheetDescription className="sr-only">Task details and comments</SheetDescription>
        </SheetHeader>

        {/* Task Details */}
        <div className="flex-shrink-0 px-4 space-y-3">
          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className={`text-xs px-2 py-0.5 border-0 ${LABEL_COLORS[label] || 'bg-muted text-muted-foreground'}`}
                >
                  {label}
                </Badge>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {/* Priority */}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${priorityConfig.bg} ${priorityConfig.color}`}>
              {priorityConfig.icon}
              {priorityConfig.label}
            </span>

            {/* Column */}
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-muted capitalize">
              {task.column}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}

            {/* Assignee */}
            {task.assignee && (
              <span className="inline-flex items-center gap-1 text-xs">
                <User className="h-3 w-3" />
                {task.assignee}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        <Separator className="flex-shrink-0" />

        {/* Comments Section */}
        <div className="flex-1 flex flex-col min-h-0 px-4">
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">
              Comments {comments.length > 0 && `(${comments.length})`}
            </h3>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
            {loadingComments && (
              <p className="text-xs text-muted-foreground text-center py-4">Loading comments...</p>
            )}
            {!loadingComments && comments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be the first to add one.</p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                    {getInitials(comment.author)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium capitalize">{comment.author}</span>
                    <span className="text-[10px] text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment input */}
          <div className="flex-shrink-0 pt-3 pb-2">
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                className="min-h-[40px] max-h-[120px] text-sm resize-none"
                disabled={submitting}
              />
              <Button
                size="icon"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="flex-shrink-0 h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
