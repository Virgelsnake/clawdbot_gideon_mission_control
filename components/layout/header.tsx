'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  ChevronDown,
  Settings,
  Users,
  LayoutGrid,
  HelpCircle,
  Brain,
  Rocket,
  Calendar,
} from 'lucide-react';
import { useSettings } from '@/contexts/settings-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const views = [
  { id: 'mission-control', label: 'Mission Control', icon: Rocket, href: '/' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar' },
  { id: 'second-brain', label: 'Second Brain', icon: Brain, href: '/second-brain' },
];

export function Header() {
  const { openSettings } = useSettings();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentView = views.find(view =>
    view.href === '/' ? pathname === '/' : pathname.startsWith(view.href)
  ) || views[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-4 lg:px-6">
        {/* Left Section - Logo & Workspace */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <LayoutGrid className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Gideon</span>
          </div>

          <div className="hidden md:flex items-center">
            <div className="h-4 w-px bg-border mx-2" />
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 font-medium">
                    <currentView.icon className="h-4 w-4 mr-1" />
                    {currentView.label}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {views.map((view) => {
                    const Icon = view.icon;
                    const isActive = currentView.id === view.id;
                    return (
                      <DropdownMenuItem
                        key={view.id}
                        onClick={() => router.push(view.href)}
                        className="cursor-pointer"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {view.label}
                        {isActive && (
                          <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <Users className="h-4 w-4 mr-2" />
                    Team Workspace
                    <Badge variant="outline" className="ml-auto text-xs">Soon</Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" className="gap-1 font-medium">
                <currentView.icon className="h-4 w-4 mr-1" />
                {currentView.label}
                <ChevronDown className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative hidden sm:flex">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <HelpCircle className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={openSettings}>
            <Settings className="h-5 w-5" />
          </Button>

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      SS
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      SS
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Steve Shearman</span>
                    <span className="text-xs text-muted-foreground">steve@example.com</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Team Members</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  SS
                </AvatarFallback>
              </Avatar>
            </Button>
          )}

          <span className="hidden sm:inline-flex">
            <ThemeToggle />
          </span>
        </div>
      </div>
    </header>
  );
}
