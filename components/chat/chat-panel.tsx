'use client';

import { useState, useCallback, useEffect } from 'react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { Button } from '@/components/ui/button';
import { PanelRightClose, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/contexts/chat-context';
import { useAgent } from '@/contexts/agent-context';
import { sendMessage } from '@/lib/api/chat';
import { toast } from 'sonner';
import { ChatPanelHeader } from './chat-panel-header';

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { messages, addMessage, appendToLastMessage, setStreaming, persistLastAssistantMessage, clearMessages } = useChat();
  const { currentModel, setStatus } = useAgent();

  // Handle responsive detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Add user message (persisted to Supabase)
      await addMessage('user', content);

      // Add empty assistant message placeholder (persisted after stream)
      await addMessage('assistant', '');

      setStreaming(true);
      setStatus('thinking');

      // Convert messages to API format
      const apiMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      apiMessages.push({ role: 'user', content });

      await sendMessage({
        model: currentModel,
        messages: apiMessages,
        onToken: (token) => {
          appendToLastMessage(token);
          setStatus('active');
        },
        onError: (error) => {
          setStreaming(false);
          setStatus('idle');
          toast.error(`Chat error: ${error.message}`);
        },
        onComplete: () => {
          setStreaming(false);
          setStatus('idle');
          // Persist the completed assistant message to Supabase
          persistLastAssistantMessage();
        },
      });
    },
    [messages, addMessage, appendToLastMessage, setStreaming, persistLastAssistantMessage, currentModel, setStatus]
  );

  if (!isOpen) {
    return (
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 z-[100] h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow lg:top-20 lg:h-10 lg:w-10 lg:rounded-md"
        aria-label="Open chat panel"
      >
        <div className="relative">
          <MessageSquare className="h-6 w-6 lg:h-5 lg:w-5" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary lg:hidden" />
          )}
        </div>
      </Button>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={cn(
        "border-l border-border bg-background flex flex-col z-[100] transition-all duration-300 ease-out",
        isMobile 
          ? "fixed inset-x-4 top-16 bottom-4 rounded-xl shadow-2xl max-w-md mx-auto h-auto" 
          : "w-80 relative"
      )}>
        <div className="flex items-center justify-between border-b border-border p-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Chat</h2>
            {messages.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({messages.length})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  clearMessages();
                  toast.success('Conversation cleared');
                }}
                aria-label="Clear conversation"
                className="hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat panel"
              className="hover:bg-muted transition-colors"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ChatPanelHeader />
        <div className={cn('flex-1 overflow-hidden p-3')}>
          <MessageList />
        </div>
        <ChatInput onSendMessage={handleSendMessage} />
      </aside>
    </>
  );
}
