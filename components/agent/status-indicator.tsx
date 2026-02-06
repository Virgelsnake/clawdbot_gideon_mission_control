'use client';

import { useAgent, type DisplayStatus } from '@/contexts/agent-context';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  DisplayStatus,
  { label: string; color: string; bg: string; pulse: boolean; emoji: string; ringColor: string }
> = {
  idle: {
    label: 'Idle',
    color: 'bg-gray-500',
    bg: 'bg-gray-500/10',
    pulse: false,
    emoji: '😴',
    ringColor: 'from-gray-400/0 via-gray-400/50 to-gray-400/0',
  },
  thinking: {
    label: 'Thinking',
    color: 'bg-yellow-500',
    bg: 'bg-yellow-500/10',
    pulse: true,
    emoji: '🤔',
    ringColor: 'from-yellow-400/0 via-yellow-400/60 to-yellow-400/0',
  },
  active: {
    label: 'Active',
    color: 'bg-green-500',
    bg: 'bg-green-500/10',
    pulse: true,
    emoji: '⚡',
    ringColor: 'from-green-400/0 via-green-400/60 to-green-400/0',
  },
  resting: {
    label: 'Resting',
    color: 'bg-red-500',
    bg: 'bg-red-500/10',
    pulse: false,
    emoji: '🛑',
    ringColor: 'from-red-400/0 via-red-400/50 to-red-400/0',
  },
  disconnected: {
    label: 'Disconnected',
    color: 'bg-orange-500',
    bg: 'bg-orange-500/10',
    pulse: false,
    emoji: '🔌',
    ringColor: 'from-orange-400/0 via-orange-400/40 to-orange-400/0',
  },
};

export function StatusIndicator() {
  const { displayStatus, currentModel, connected, lastHeartbeat } = useAgent();
  const config = statusConfig[displayStatus];

  // Format last heartbeat for tooltip
  const heartbeatLabel = lastHeartbeat
    ? `Last heartbeat: ${new Date(lastHeartbeat).toLocaleTimeString()}`
    : 'No heartbeat received';

  return (
    <div className="flex flex-col items-start gap-2">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2 rounded-full',
          config.bg
        )}
        title={`${config.label} · ${currentModel} · ${heartbeatLabel}`}
      >
        {/* Emoji with pulsing gradient ring */}
        <div className="relative">
          {/* Pulsing gradient ring */}
          <div
            className={cn(
              'absolute -inset-1 rounded-full bg-gradient-to-r blur-sm',
              config.ringColor,
              config.pulse && 'animate-pulse'
            )}
          />
          {/* Emoji face */}
          <span className="relative text-2xl">{config.emoji}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-2 h-2 rounded-full',
            config.color,
            config.pulse && 'animate-pulse'
          )} />
          <span className="text-sm font-medium text-foreground">
            {config.label}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground px-1">
        {displayStatus === 'disconnected'
          ? 'Disconnected'
          : connected
            ? currentModel
            : 'Gateway offline'}
      </span>
    </div>
  );
}
