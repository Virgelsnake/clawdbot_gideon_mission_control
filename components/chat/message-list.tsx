'use client';

import { useChat } from '@/contexts/chat-context';
import { MessageBubble } from './message-bubble';
import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

function getDateHeader(timestamp: number, prevTimestamp: number | null): string | null {
  const date = new Date(timestamp);
  const dateStr = date.toDateString();

  if (prevTimestamp !== null) {
    const prevDateStr = new Date(prevTimestamp).toDateString();
    if (dateStr === prevDateStr) return null;
  }

  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function MessageList() {
  const { messages, isStreaming, isLoading, hasMore, loadMore } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Track whether user has scrolled up (disable auto-scroll)
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Auto-scroll if within 100px of bottom
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Auto-scroll to bottom when new messages arrive or streaming
  useEffect(() => {
    if (scrollRef.current && shouldAutoScroll.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex h-full flex-col gap-3 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex gap-2.5 px-3 py-2 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <div className={`flex flex-col gap-1.5 flex-1 ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className={`h-10 rounded-lg ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
          <span className="text-lg">💬</span>
        </div>
        <p className="text-sm font-medium text-foreground">No messages yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          Send a message to start a conversation with Gideon
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex h-full flex-col gap-2 overflow-y-auto pr-2"
    >
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={isLoading}
            className="text-xs text-muted-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </>
            ) : (
              'Load older messages'
            )}
          </Button>
        </div>
      )}
      {messages.map((message, index) => {
        const dateHeader = getDateHeader(message.timestamp, index > 0 ? messages[index - 1].timestamp : null);
        return (
          <MessageBubble key={message.id} message={message} showDateHeader={dateHeader} />
        );
      })}
      {isStreaming && (
        <div 
          className="flex items-center gap-2.5 px-3 py-2"
          aria-live="polite"
          aria-label="Gideon is typing"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <div className="flex gap-[3px]">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-[typing-dot_1.4s_ease-in-out_infinite]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-[typing-dot_1.4s_ease-in-out_0.2s_infinite]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-[typing-dot_1.4s_ease-in-out_0.4s_infinite]" />
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground/60 italic">Gideon is thinking...</span>
        </div>
      )}
    </div>
  );
}
