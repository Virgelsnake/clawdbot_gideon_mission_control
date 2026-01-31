'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Message } from '@/types';

interface ChatContextValue {
  messages: Message[];
  isStreaming: boolean;
  addMessage: (role: Message['role'], content: string) => void;
  appendToLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreamingState] = useState<boolean>(false);

  const addMessage = useCallback((role: Message['role'], content: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
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

  const setStreaming = useCallback((streaming: boolean) => {
    setIsStreamingState(streaming);
  }, []);

  const value: ChatContextValue = {
    messages,
    isStreaming,
    addMessage,
    appendToLastMessage,
    setStreaming,
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
