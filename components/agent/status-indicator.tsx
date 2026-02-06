'use client';

import { useAgent, type DisplayStatus } from '@/contexts/agent-context';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const statusConfig: Record<
  DisplayStatus,
  { label: string; dotColor: string; ringColor: string; animate: boolean; emoji: string }
> = {
  idle: {
    label: 'Idle',
    dotColor: 'bg-gray-400',
    ringColor: 'border-gray-300 dark:border-gray-600',
    animate: false,
    emoji: '😴',
  },
  thinking: {
    label: 'Thinking',
    dotColor: 'bg-yellow-500',
    ringColor: 'border-yellow-400/60',
    animate: true,
    emoji: '🤔',
  },
  active: {
    label: 'Active',
    dotColor: 'bg-green-500',
    ringColor: 'border-green-400/60',
    animate: true,
    emoji: '⚡',
  },
  resting: {
    label: 'Resting',
    dotColor: 'bg-red-500',
    ringColor: 'border-red-400/50',
    animate: false,
    emoji: '🛑',
  },
  disconnected: {
    label: 'Disconnected',
    dotColor: 'bg-orange-500',
    ringColor: 'border-orange-400/40',
    animate: false,
    emoji: '🔌',
  },
};

function formatHeartbeatAge(lastHeartbeat: string | null): string {
  if (!lastHeartbeat) return 'No heartbeat';
  const age = Date.now() - new Date(lastHeartbeat).getTime();
  if (age < 60_000) return 'Just now';
  if (age < 3600_000) return `${Math.floor(age / 60_000)}m ago`;
  return `${Math.floor(age / 3600_000)}h ago`;
}

export function StatusIndicator() {
  const { displayStatus, currentModel, connected, lastHeartbeat } = useAgent();
  const config = statusConfig[displayStatus];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2.5 cursor-default">
            {/* Animated ring + emoji */}
            <div className="relative flex items-center justify-center">
              {/* Spinning ring for active states */}
              <div
                className={cn(
                  'absolute inset-0 rounded-full border-2 border-transparent transition-all duration-500',
                  config.animate && config.ringColor,
                  config.animate && 'border-t-transparent animate-[status-ring-spin_2s_linear_infinite]'
                )}
                style={{ width: 32, height: 32, margin: -2 }}
              />
              <span className="text-xl leading-none transition-transform duration-300">{config.emoji}</span>
            </div>

            <div className="flex flex-col gap-0">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full transition-colors duration-300',
                  config.dotColor,
                  config.animate && 'animate-pulse'
                )} />
                <span className="text-sm font-medium text-foreground leading-tight">
                  {config.label}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground leading-tight pl-3">
                {connected
                  ? currentModel
                  : displayStatus === 'disconnected'
                    ? 'Disconnected'
                    : 'Gateway offline'}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-[220px]">
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{config.label}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium truncate max-w-[140px]">{currentModel}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Heartbeat</span>
              <span className="font-medium">{formatHeartbeatAge(lastHeartbeat ?? null)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Gateway</span>
              <span className={cn('font-medium', connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                {connected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
