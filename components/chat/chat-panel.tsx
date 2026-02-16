'use client';

import { useState, useCallback, useEffect } from 'react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { Button } from '@/components/ui/button';
import { PanelRightClose, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/contexts/chat-context';
import { useAgent } from '@/contexts/agent-context';
import { useMobileView } from '@/contexts/mobile-view-context';
import { useUI } from '@/contexts/ui-context';
import { sendMessage } from '@/lib/api/chat';
import { toast } from 'sonner';
import { ChatPanelHeader } from './chat-panel-header';

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [isTabletOverlay, setIsTabletOverlay] = useState(false);
  const { messages, addMessage, appendToLastMessage, setStreaming, persistLastAssistantMessage, clearMessages } = useChat();
  const { currentModel, setStatus } = useAgent();
  const { isMobile, activeTab } = useMobileView();
  const { isTaskDetailOpen, isCardDetailOpen, wasChatPanelOpenBeforeTask, setWasChatPanelOpenBeforeTask } = useUI();

  // Handle tablet overlay detection (640px–1024px)
  useEffect(() => {
    const checkTablet = () => {
      setIsTabletOverlay(window.innerWidth >= 640 && window.innerWidth < 1024);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  // Auto-collapse chat when any detail panel opens, restore when all close
  useEffect(() => {
    if (isMobile) return; // Don't auto-collapse on mobile

    const isAnyDetailOpen = isTaskDetailOpen || isCardDetailOpen;

    if (isAnyDetailOpen) {
      // Detail opened: remember current state and collapse chat (only if not already collapsed)
      if (isOpen) {
        setWasChatPanelOpenBeforeTask(true);
        setIsOpen(false);
      }
    } else {
      // All details closed: restore chat to its previous state
      setIsOpen(wasChatPanelOpenBeforeTask);
    }
  }, [isTaskDetailOpen, isCardDetailOpen, isMobile]); // Run when any detail opens/closes

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

  // Mobile: full-screen chat controlled by bottom nav tab
  if (isMobile) {
    if (activeTab !== 'chat') return null;

    return (
      <aside className="fixed inset-0 top-12 bottom-14 z-40 bg-background flex flex-col">
        <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">Chat</h2>
            {messages.length > 0 && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {messages.length}
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
          </div>
        </div>
        <ChatPanelHeader />
        <div className="flex-1 overflow-hidden px-1 py-2">
          <MessageList />
        </div>
        <ChatInput onSendMessage={handleSendMessage} />
      </aside>
    );
  }

  // Desktop / Tablet: collapsible side panel
  if (!isOpen) {
    return (
      <>
        {/* Tablet: fixed FAB at bottom-right */}
        {isTabletOverlay && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="fixed right-4 bottom-4 z-[100] h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Open chat panel"
          >
            <div className="relative">
              <MessageSquare className="h-6 w-6" />
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
              )}
            </div>
          </Button>
        )}
        {/* Desktop: sits in the same layout slot as the chat panel */}
        <aside className="hidden lg:flex border-l border-border/50 bg-background flex-col items-center pt-[13px] px-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-8 w-8"
            aria-label="Open chat panel"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </aside>
      </>
    );
  }

  return (
    <>
      {/* Tablet overlay */}
      {isTabletOverlay && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={cn(
        "border-l border-border/50 bg-background flex flex-col z-[100] transition-all duration-300 ease-out",
        isTabletOverlay 
          ? "fixed inset-x-4 top-16 bottom-4 rounded-xl shadow-2xl max-w-md mx-auto h-auto" 
          : "w-80 relative"
      )}>
        <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">Chat</h2>
            {messages.length > 0 && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {messages.length}
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
        <div className="flex-1 overflow-hidden px-1 py-2">
          <MessageList />
        </div>
        <ChatInput onSendMessage={handleSendMessage} />
      </aside>
    </>
  );
}
