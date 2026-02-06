'use client';

import { StatusIndicator } from '@/components/agent/status-indicator';
import { ModelSelector } from '@/components/agent/model-selector';

export function ChatPanelHeader() {
  return (
    <div className="border-b border-border/50 bg-muted/20 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <StatusIndicator />
        <ModelSelector />
      </div>
    </div>
  );
}
