'use client';

import { StatusIndicator } from '@/components/agent/status-indicator';
import { ModelSelector } from '@/components/agent/model-selector';

export function ChatPanelHeader() {
  return (
    <div className="border-b border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <StatusIndicator />
        <ModelSelector />
      </div>
    </div>
  );
}
