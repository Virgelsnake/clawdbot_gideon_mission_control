import { useCallback, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/chat-context';
import { processConversationForCardGeneration, shouldGenerateCard } from '@/lib/second-brain/generator';
import type { Message } from '@/types';

const CHECK_INTERVAL_MS = 60000; // Check every minute
const MIN_MESSAGES_BEFORE_CHECK = 5;

interface UseAutoCardGenerationOptions {
  enabled?: boolean;
  minMessages?: number;
  minContentLength?: number;
  checkIntervalMs?: number;
  onCardGenerated?: (card: { id: string; title: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to automatically generate cards from chat conversations
 * 
 * Usage:
 * ```tsx
 * function ChatComponent() {
 *   useAutoCardGeneration({
 *     enabled: true,
 *     onCardGenerated: (card) => console.log('Generated card:', card.title),
 *   });
 *   // ... rest of component
 * }
 * ```
 */
export function useAutoCardGeneration(options: UseAutoCardGenerationOptions = {}) {
  const {
    enabled = true,
    minMessages = 5,
    minContentLength = 300,
    checkIntervalMs = CHECK_INTERVAL_MS,
    onCardGenerated,
    onError,
  } = options;
  
  const { messages } = useChat();
  const lastCheckRef = useRef<number>(0);
  const lastCardGenerationRef = useRef<number>(0);
  const checkingRef = useRef<boolean>(false);
  
  const checkAndGenerate = useCallback(async () => {
    if (!enabled || checkingRef.current) return;
    if (messages.length < minMessages) return;
    
    // Don't check too frequently
    const now = Date.now();
    if (now - lastCheckRef.current < checkIntervalMs) return;
    
    // Don't generate cards too frequently (max 1 per 5 minutes)
    if (now - lastCardGenerationRef.current < 5 * 60 * 1000) return;
    
    checkingRef.current = true;
    lastCheckRef.current = now;
    
    try {
      const check = await shouldGenerateCard(messages, {
        minMessages,
        minContentLength,
      });
      
      if (check.shouldGenerate) {
        console.log('[AutoCardGen] Generating card...');
        
        const result = await processConversationForCardGeneration(messages);
        
        if (result) {
          console.log('[AutoCardGen] Card generated:', result.card.id);
          lastCardGenerationRef.current = Date.now();
          onCardGenerated?.({ id: result.card.id, title: result.card.title });
        }
      }
    } catch (err) {
      console.error('[AutoCardGen] Error:', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      checkingRef.current = false;
    }
  }, [enabled, messages, minMessages, minContentLength, checkIntervalMs, onCardGenerated, onError]);
  
  // Check periodically
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(checkAndGenerate, checkIntervalMs);
    return () => clearInterval(interval);
  }, [enabled, checkAndGenerate, checkIntervalMs]);
  
  // Manual trigger
  const generateNow = useCallback(async () => {
    if (messages.length < 2) {
      console.log('[AutoCardGen] Not enough messages to generate card');
      return null;
    }
    
    try {
      const result = await processConversationForCardGeneration(messages);
      if (result) {
        lastCardGenerationRef.current = Date.now();
        onCardGenerated?.({ id: result.card.id, title: result.card.title });
      }
      return result;
    } catch (err) {
      console.error('[AutoCardGen] Manual generation error:', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, [messages, onCardGenerated, onError]);
  
  return {
    generateNow,
    messageCount: messages.length,
    canGenerate: messages.length >= minMessages,
  };
}
