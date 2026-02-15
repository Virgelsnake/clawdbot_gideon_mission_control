'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layout, Brain, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardOption {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const dashboards: DashboardOption[] = [
  {
    id: 'mission-control',
    name: 'Mission Control',
    description: 'Kanban board & task management',
    href: '/',
    icon: Layout,
  },
  {
    id: 'second-brain',
    name: 'Second Brain',
    description: 'Captured conversations & memories',
    href: '/second-brain',
    icon: Brain,
  },
];

interface DashboardSelectorProps {
  className?: string;
}

export function DashboardSelector({ className }: DashboardSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine current dashboard based on pathname
  const currentDashboard =
    dashboards.find((d) => d.href === pathname) || dashboards[0];

  const handleSelect = (href: string) => {
    router.push(href);
  };

  const Icon = currentDashboard.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'group flex items-center gap-2 px-2 font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:ring-1 focus-visible:ring-ring',
            className
          )}
          aria-label={`Current dashboard: ${currentDashboard.name}. Click to switch dashboards.`}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline">{currentDashboard.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-64 p-1.5"
        sideOffset={6}
      >
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Switch dashboard
        </div>

        {dashboards.map((dashboard) => {
          const DashboardIcon = dashboard.icon;
          const isActive = dashboard.id === currentDashboard.id;

          return (
            <DropdownMenuItem
              key={dashboard.id}
              onClick={() => handleSelect(dashboard.href)}
              className={cn(
                'group relative flex cursor-pointer items-start gap-3 rounded-md p-2.5 transition-colors',
                'focus:bg-accent focus:text-accent-foreground',
                isActive && 'bg-accent/50'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20'
                )}
              >
                <DashboardIcon className="h-4 w-4" />
              </div>

              <div className="flex flex-1 flex-col items-start gap-0.5">
                <span className="text-sm font-medium leading-none">
                  {dashboard.name}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {dashboard.description}
                </span>
              </div>

              {isActive && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
