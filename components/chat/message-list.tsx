'use client';

import { useChat } from '@/contexts/chat-context';
import { MessageBubble } from './message-bubble';
import { useEffect, useRef } from 'react';

export function MessageList() {
  const { messages, isStreaming } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

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
      className="flex flex-col gap-2 overflow-y-auto pr-2"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
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
