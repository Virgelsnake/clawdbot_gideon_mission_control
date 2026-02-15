'use client';

import { useState, useEffect } from 'react';
import { ConversationCard } from '@/components/second-brain/conversation-card';
import { SearchBar } from '@/components/second-brain/search-bar';
import { FilterChips } from '@/components/second-brain/filter-chips';
import { ConversationDetail } from '@/components/second-brain/conversation-detail';
import { Button } from '@/components/ui/button';
import { Brain, Plus, Loader2 } from 'lucide-react';
import { useSecondBrain } from '@/contexts/second-brain-context';
import { ConversationCard as ConversationSummary } from '@/types';

export default function SecondBrainPage() {
  const { cards, isLoading, refreshCards } = useSecondBrain();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    source: 'all',
    dateRange: 'all',
    importance: 'all',
  });
  const [selectedCard, setSelectedCard] = useState<ConversationSummary | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    refreshCards();
  }, [refreshCards]);

  const filteredCards = cards.filter((card) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        card.title.toLowerCase().includes(query) ||
        card.summary.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Source filter
    if (filters.source !== 'all' && card.sourceType !== filters.source) {
      return false;
    }

    // Importance filter
    if (filters.importance !== 'all') {
      const importance = parseInt(filters.importance);
      if (card.importance !== importance) return false;
    }

    return true;
  });

  const handleCardClick = (card: ConversationSummary) => {
    setSelectedCard(card);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Second Brain</h1>
            <p className="text-sm text-muted-foreground">
              {filteredCards.length} conversation{filteredCards.length !== 1 ? 's' : ''} captured
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Capture</span>
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="border-b border-border/50 px-4 py-3 lg:px-6 space-y-3">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterChips filters={filters} onChange={setFilters} />
      </div>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {filteredCards.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Brain className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No conversations yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Your captured conversations will appear here. Use /remember in chat to save a conversation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredCards.map((card) => (
              <ConversationCard
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <ConversationDetail
        card={selectedCard}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
