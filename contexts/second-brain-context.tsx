'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ConversationCard, CardFilters, CardTag } from '@/types';

interface SecondBrainContextValue {
  // Cards
  cards: ConversationCard[];
  isLoading: boolean;
  hasMore: boolean;
  filters: CardFilters;
  setFilters: (filters: CardFilters) => void;
  refreshCards: () => Promise<void>;
  loadMore: () => Promise<void>;

  // Selected card
  selectedCard: ConversationCard | null;
  selectCard: (card: ConversationCard | null) => void;

  // Actions
  archiveCard: (id: string) => Promise<void>;
  unarchiveCard: (id: string) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  addTag: (cardId: string, tag: string) => Promise<void>;
  removeTag: (cardId: string, tagId: string) => Promise<void>;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: ConversationCard[];
  isSearching: boolean;

  // Stats
  stats: {
    total: number;
    active: number;
    archived: number;
  } | null;
  refreshStats: () => Promise<void>;
}

const SecondBrainContext = createContext<SecondBrainContextValue | undefined>(undefined);

const PAGE_SIZE = 20;

export function SecondBrainProvider({ children }: { children: React.ReactNode }) {
  // Cards state
  const [cards, setCards] = useState<ConversationCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<CardFilters>({ status: 'active' });

  // Selected card
  const [selectedCard, setSelectedCard] = useState<ConversationCard | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ConversationCard[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Stats
  const [stats, setStats] = useState<{ total: number; active: number; archived: number } | null>(null);

  // Fetch cards
  const fetchCards = useCallback(async (reset = false) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const currentOffset = reset ? 0 : offset;

      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(currentOffset));
      params.set('withTags', 'true');

      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('q', filters.search);
      if (filters.sourceType) params.set('sourceType', filters.sourceType);

      const response = await fetch(`/api/second-brain/cards?${params}`);
      const data = await response.json();

      if (response.ok) {
        const newCards = data.cards;

        if (reset) {
          setCards(newCards);
        } else {
          setCards(prev => [...prev, ...newCards]);
        }

        setHasMore(newCards.length === PAGE_SIZE);
        setOffset(currentOffset + newCards.length);
      }
    } catch (err) {
      console.error('Failed to fetch cards:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, offset, isLoading]);

  // Initial fetch
  useEffect(() => {
    fetchCards(true);
  }, [filters.status, filters.sourceType]);

  // Search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);

      try {
        const response = await fetch(`/api/second-brain/cards?search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        if (response.ok) {
          setSearchResults(data.cards);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Actions
  const refreshCards = useCallback(async () => {
    setOffset(0);
    await fetchCards(true);
  }, [fetchCards]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await fetchCards(false);
    }
  }, [fetchCards, isLoading, hasMore]);

  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch('/api/second-brain/cards?stats=true');
      const data = await response.json();

      if (response.ok) {
        setStats({
          total: data.total,
          active: data.active,
          archived: data.archived,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const archiveCard = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/second-brain/cards/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'archive' }),
      });

      if (response.ok) {
        setCards(prev => prev.filter(c => c.id !== id));
        if (selectedCard?.id === id) setSelectedCard(null);
        refreshStats();
      }
    } catch (err) {
      console.error('Failed to archive card:', err);
    }
  }, [selectedCard, refreshStats]);

  const unarchiveCard = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/second-brain/cards/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'unarchive' }),
      });

      if (response.ok) {
        refreshCards();
        refreshStats();
      }
    } catch (err) {
      console.error('Failed to unarchive card:', err);
    }
  }, [refreshCards, refreshStats]);

  const deleteCard = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/second-brain/cards?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCards(prev => prev.filter(c => c.id !== id));
        if (selectedCard?.id === id) setSelectedCard(null);
        refreshStats();
      }
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  }, [selectedCard, refreshStats]);

  const addTag = useCallback(async (cardId: string, tag: string) => {
    try {
      const response = await fetch('/api/second-brain/cards/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, tag }),
      });

      if (response.ok) {
        // Refresh selected card if it's the one being modified
        if (selectedCard?.id === cardId) {
          const cardResponse = await fetch(`/api/second-brain/cards?id=${cardId}&withTags=true`);
          const cardData = await cardResponse.json();
          if (cardResponse.ok) {
            setSelectedCard(cardData);
          }
        }
      }
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  }, [selectedCard]);

  const removeTag = useCallback(async (cardId: string, tagId: string) => {
    try {
      const response = await fetch(`/api/second-brain/cards/tags?cardId=${cardId}&tagId=${tagId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (selectedCard?.id === cardId) {
          setSelectedCard(prev => prev ? {
            ...prev,
            tags: prev.tags?.filter(t => t.id !== tagId) ?? []
          } : null);
        }
      }
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  }, [selectedCard]);

  // Load stats on mount
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const value: SecondBrainContextValue = {
    cards,
    isLoading,
    hasMore,
    filters,
    setFilters,
    refreshCards,
    loadMore,
    selectedCard,
    selectCard: setSelectedCard,
    archiveCard,
    unarchiveCard,
    deleteCard,
    addTag,
    removeTag,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    stats,
    refreshStats,
  };

  return (
    <SecondBrainContext.Provider value={value}>
      {children}
    </SecondBrainContext.Provider>
  );
}

export function useSecondBrain() {
  const context = useContext(SecondBrainContext);
  if (context === undefined) {
    throw new Error('useSecondBrain must be used within a SecondBrainProvider');
  }
  return context;
}
