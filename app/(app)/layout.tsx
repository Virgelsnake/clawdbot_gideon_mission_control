import { AgentProvider } from '@/contexts/agent-context';
import { Header } from '@/components/layout/header';
import { MainContent } from '@/components/layout/main-content';
import { ChatProvider } from '@/contexts/chat-context';
import { TaskProvider } from '@/contexts/task-context';
import { ChatPanel } from '@/components/chat/chat-panel';
import { SettingsProvider } from '@/contexts/settings-context';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { MobileViewProvider } from '@/contexts/mobile-view-context';
import { BottomNav } from '@/components/layout/bottom-nav';
import { MobileSettingsWrapper } from '@/components/layout/mobile-settings-wrapper';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AgentProvider>
      <ChatProvider>
        <SettingsProvider>
          <TaskProvider>
            <MobileViewProvider>
              <div className="flex h-screen flex-col overflow-hidden">
                <Header />
                <div className="flex flex-1 overflow-hidden pb-14 sm:pb-0">
                  <MainContent>{children}</MainContent>
                  <ChatPanel />
                </div>
                <BottomNav />
              </div>
              <SettingsPanel />
              <MobileSettingsWrapper />
            </MobileViewProvider>
          </TaskProvider>
        </SettingsProvider>
      </ChatProvider>
    </AgentProvider>
  );
}
