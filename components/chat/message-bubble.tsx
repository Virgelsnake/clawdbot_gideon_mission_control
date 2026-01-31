'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg',
        isUser ? 'flex-row-reverse bg-muted/50' : 'flex-row bg-background'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <span className="text-xs font-medium text-muted-foreground">
          {isUser ? 'You' : 'Gideon'}
        </span>
        <div
          className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
