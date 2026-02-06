'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import type { Message } from '@/types';
import {
  fetchMessages,
  createMessage as dbCreateMessage,
  deleteAllMessages as dbDeleteAllMessages,
} from '@/lib/supabase/messages';

const PAGE_SIZE = 50;

interface ChatContextValue {
  messages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  hasMore: boolean;
  addMessage: (role: Message['role'], content: string) => Promise<Message>;
  appendToLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  persistLastAssistantMessage: () => Promise<void>;
  clearMessages: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreamingState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const initialLoadDone = useRef(false);

  // Load initial messages from Supabase
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      try {
        const loaded = await fetchMessages({ limit: PAGE_SIZE });
        setMessages(loaded);
        setHasMore(loaded.length === PAGE_SIZE);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Load older messages (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const oldest = messages[0];
    if (!oldest) return;

    setIsLoading(true);
    try {
      const olderTimestamp = new Date(oldest.timestamp).toISOString();
      const older = await fetchMessages({ limit: PAGE_SIZE, before: olderTimestamp });
      if (older.length < PAGE_SIZE) setHasMore(false);
      if (older.length > 0) {
        setMessages((prev) => [...older, ...prev]);
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, messages]);

  // Add a message — persists user messages to Supabase immediately.
  // For assistant messages, we add a local placeholder (empty content)
  // and persist after streaming completes via persistLastAssistantMessage().
  const addMessage = useCallback(async (role: Message['role'], content: string): Promise<Message> => {
    if (role === 'user') {
      // Persist user message to Supabase
      try {
        const saved = await dbCreateMessage(role, content);
        setMessages((prev) => [...prev, saved]);
        return saved;
      } catch (err) {
        console.error('Failed to persist user message:', err);
        // Fall back to local-only message
        const local: Message = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role,
          content,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, local]);
        return local;
      }
    }

    // Assistant placeholder — not persisted yet
    const placeholder: Message = {
      id: `streaming-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, placeholder]);
    return placeholder;
  }, []);

  const appendToLastMessage = useCallback((content: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const lastMessage = prev[prev.length - 1];
      if (lastMessage.role !== 'assistant') return prev;

      const updatedLastMessage: Message = {
        ...lastMessage,
        content: lastMessage.content + content,
      };
      return [...prev.slice(0, -1), updatedLastMessage];
    });
  }, []);

  // Persist the last assistant message to Supabase after streaming completes
  const persistLastAssistantMessage = useCallback(async () => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || !last.content) return;

    try {
      const saved = await dbCreateMessage('assistant', last.content);
      // Replace the local placeholder with the persisted version
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === last.id);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      });
    } catch (err) {
      console.error('Failed to persist assistant message:', err);
    }
  }, [messages]);

  const setStreaming = useCallback((streaming: boolean) => {
    setIsStreamingState(streaming);
  }, []);

  const clearMessages = useCallback(async () => {
    try {
      await dbDeleteAllMessages();
      setMessages([]);
      setHasMore(false);
    } catch (err) {
      console.error('Failed to clear messages:', err);
    }
  }, []);

  const value: ChatContextValue = {
    messages,
    isStreaming,
    isLoading,
    hasMore,
    addMessage,
    appendToLastMessage,
    setStreaming,
    persistLastAssistantMessage,
    clearMessages,
    loadMore,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
