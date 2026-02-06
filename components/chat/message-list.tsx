'use client';

import { useChat } from '@/contexts/chat-context';
import { MessageBubble } from './message-bubble';
import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span>Loading messages...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <p>Start a conversation with Gideon...</p>
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
          className="flex items-center gap-2 p-3 text-sm text-muted-foreground"
          aria-live="polite"
          aria-label="Gideon is typing"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <div className="flex gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
          <span className="text-xs">Gideon is thinking...</span>
        </div>
      )}
    </div>
  );
}
