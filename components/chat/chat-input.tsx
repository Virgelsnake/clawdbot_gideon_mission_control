'use client';

import { useState, KeyboardEvent } from 'react';
import { useChat } from '@/contexts/chat-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage?: (message: string) => void | Promise<void>;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [input, setInput] = useState('');
  const { isStreaming } = useChat();

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setInput('');
    if (onSendMessage) {
      await onSendMessage(trimmed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-border/50 px-3 py-2.5">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={isStreaming}
        className="flex-1 resize-none h-9 text-sm bg-muted/30 border-border/50 focus-visible:ring-1"
      />
      <Button
        onClick={handleSend}
        disabled={!input.trim() || isStreaming}
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label="Send message"
      >
        <Send className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
