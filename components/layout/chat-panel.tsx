import { ReactNode } from 'react';

interface ChatPanelProps {
  children?: ReactNode;
}

export function ChatPanel({ children }: ChatPanelProps) {
  return (
    <aside className="w-80 border-l border-border bg-background p-4">
      <div className="flex h-full flex-col">
        <h2 className="mb-4 text-sm font-semibold">Chat</h2>
        <div className="flex-1 overflow-auto">
          {children || <p className="text-sm text-muted-foreground">Chat panel placeholder</p>}
        </div>
      </div>
    </aside>
  );
}
