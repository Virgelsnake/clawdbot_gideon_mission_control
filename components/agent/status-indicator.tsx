'use client';

import { useAgent } from '@/contexts/agent-context';
import type { AgentStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<AgentStatus, { label: string; color: string; bg: string; pulse: boolean; emoji: string }> = {
  idle: {
    label: 'Idle',
    color: 'bg-gray-500',
    bg: 'bg-gray-500/10',
    pulse: false,
    emoji: '💤',
  },
  thinking: {
    label: 'Thinking',
    color: 'bg-yellow-500',
    bg: 'bg-yellow-500/10',
    pulse: true,
    emoji: '🤔',
  },
  active: {
    label: 'Active',
    color: 'bg-green-500',
    bg: 'bg-green-500/10',
    pulse: true,
    emoji: '⚡',
  },
  resting: {
    label: 'Resting',
    color: 'bg-red-500',
    bg: 'bg-red-500/10',
    pulse: false,
    emoji: '🔴',
  },
};

export function StatusIndicator() {
  const { status, currentModel } = useAgent();
  const config = statusConfig[status];

  return (
    <div className="flex flex-col items-start gap-1">
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        config.bg
      )}>
        <span className={cn(
          'w-2.5 h-2.5 rounded-full',
          config.color,
          config.pulse && 'animate-pulse'
        )} />
        <span className="text-sm font-medium text-foreground">
          {config.emoji} {config.label}
        </span>
      </div>
      <span className="text-xs text-muted-foreground px-1">
        {currentModel}
      </span>
    </div>
  );
}
