'use client';

import { X, Archive, Trash2, Tag, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationCard } from '@/types';
import { cn } from '@/lib/utils';

interface ConversationDetailProps {
  card: ConversationCard | null;
  isOpen: boolean;
  onClose: () => void;
}

const importanceColors: Record<number, string> = {
  5: 'bg-red-500/10 text-red-500 border-red-500/20',
  4: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  3: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  2: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  1: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const importanceLabels: Record<number, string> = {
  5: 'Critical',
  4: 'High',
  3: 'Medium',
  2: 'Low',
  1: 'Low',
};

const sourceLabels: Record<string, string> = {
  chat: 'Chat Conversation',
  email: 'Email Thread',
  voice: 'Voice Memo',
  document: 'Document',
  web: 'Web Clip',
  manual: 'Manual Note',
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function ConversationDetail({ card, isOpen, onClose }: ConversationDetailProps) {
  if (!card) return null;

  const tags = card.tags?.map(t => t.tag) || [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl" showCloseButton={false}>
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-8">
              <SheetTitle className="text-left text-lg leading-tight">
                {card.title}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                {formatDate(card.conversationDate)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn(importanceColors[card.importance])}>
              {importanceLabels[card.importance]}
            </Badge>
            <Badge variant="outline">
              {sourceLabels[card.sourceType]}
            </Badge>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
                >
                  <Hash className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-2">
            {/* Summary */}
            <div>
              <h4 className="mb-2 text-sm font-medium">Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.summary}
              </p>
            </div>

            {/* Full Content */}
            {card.content && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Full Conversation</h4>
                <div className="rounded-lg bg-muted p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {card.content}
                </div>
              </div>
            )}

            {/* Linked Tasks */}
            <div>
              <h4 className="mb-2 text-sm font-medium">Linked Tasks</h4>
              <p className="text-sm text-muted-foreground">
                No tasks linked to this conversation
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="border-t bg-background p-6 pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2">
              <Tag className="h-4 w-4" />
              Edit Tags
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-2">
              <Archive className="h-4 w-4" />
              Archive
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
