'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'second-brain', label: 'Second Brain', icon: '🧠', href: '/second-brain' },
  { id: 'tasks', label: 'Tasks', icon: '📋', href: '/tasks' },
  { id: 'ideas', label: 'Ideas', icon: '💡', href: '/ideas' },
  { id: 'analytics', label: 'Analytics', icon: '📊', href: '/analytics' },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/settings' },
];

export function DashboardTabs() {
  const pathname = usePathname();
  const router = useRouter();
  
  const currentTab = tabs.find(tab => pathname.startsWith(tab.href))?.id || 'second-brain';

  return (
    <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Tabs value={currentTab} className="w-full">
        <TabsList 
          variant="line" 
          className="h-12 w-full justify-start rounded-none bg-transparent p-0 px-2 sm:px-4 lg:px-6"
        >
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onClick={() => router.push(tab.href)}
                className={cn(
                  "relative h-12 rounded-none border-b-2 border-transparent px-2 sm:px-4 py-2 text-sm font-medium transition-colors",
                  "data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none",
                  "data-[state=active]:after:opacity-0", // Hide default line indicator
                  "text-muted-foreground hover:text-foreground",
                  "flex items-center gap-1.5 sm:gap-2",
                  "flex-1 sm:flex-initial justify-center sm:justify-start"
                )}
              >
                <span className="text-base sm:text-lg" aria-hidden="true">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
