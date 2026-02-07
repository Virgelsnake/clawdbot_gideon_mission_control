'use client';

import { useMobileView, type MobileTab } from '@/contexts/mobile-view-context';
import { LayoutGrid, Lightbulb, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS: { id: MobileTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const { activeTab, setActiveTab, isMobile } = useMobileView();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
      <div className="flex h-14 items-center justify-around px-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors',
              'active:bg-muted/50',
              activeTab === id
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
            aria-label={label}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon className={cn('h-5 w-5', activeTab === id && 'scale-110')} />
            <span className={cn(
              'text-[10px] font-medium leading-none',
              activeTab === id ? 'text-primary' : 'text-muted-foreground'
            )}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
