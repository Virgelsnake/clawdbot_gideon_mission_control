'use client';

import { MessageSquare, CheckSquare, Calendar, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConversationCard as ConversationCardType } from '@/types';

interface ConversationCardProps {
  card: ConversationCardType;
  onClick: () => void;
}

const importanceColors: Record<number, string> = {
  5: 'bg-red-500/10 text-red-500 border-red-500/20',
  4: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  3: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  2: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  1: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const importanceLabels: Record<number, string> = {
  5: 'Critical',
  4: 'High',
  3: 'Medium',
  2: 'Low',
  1: 'Low',
};

const sourceIcons: Record<string, string> = {
  chat: '💬',
  email: '📧',
  voice: '🎤',
  document: '📄',
  web: '🌐',
  manual: '✏️',
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ConversationCard({ card, onClick }: ConversationCardProps) {
  const tags = card.tags?.map(t => t.tag) || [];
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md",
        "flex flex-col gap-3"
      )}
    >
      {/* Header: Date & Importance */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(card.conversationDate)}
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-medium",
            importanceColors[card.importance]
          )}
        >
          {importanceLabels[card.importance]}
        </span>
      </div>

      {/* Title */}
      <h3 className="line-clamp-2 font-semibold leading-tight">
        {card.title}
      </h3>

      {/* Summary */}
      <p className="line-clamp-3 text-sm text-muted-foreground">
        {card.summary}
      </p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              <Hash className="h-3 w-3" />
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Stats */}
      <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {card.segments?.length || 0} msgs
        </span>
        <span className="flex items-center gap-1">
          <CheckSquare className="h-3 w-3" />
          0 tasks
        </span>
        <span className="ml-auto">
          {sourceIcons[card.sourceType] || '💬'}
        </span>
      </div>
    </div>
  );
}
