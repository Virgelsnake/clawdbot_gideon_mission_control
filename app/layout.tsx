import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AgentProvider } from '@/contexts/agent-context';
import { Header } from '@/components/layout/header';
import { MainContent } from '@/components/layout/main-content';
import { ChatProvider } from '@/contexts/chat-context';
import { TaskProvider } from '@/contexts/task-context';
import { ChatPanel } from '@/components/chat/chat-panel';
import { SettingsProvider } from '@/contexts/settings-context';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gideon Mission Control',
  description: 'PWA dashboard for managing and monitoring the ClawdBot Gideon autonomous AI agent',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1e1e' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-screen overflow-hidden bg-background font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AgentProvider>
            <ChatProvider>
              <SettingsProvider>
                <TaskProvider>
                  <div className="flex h-screen flex-col overflow-hidden">
                    <Header />
                    <div className="flex flex-1 overflow-hidden">
                      <MainContent>{children}</MainContent>
                      <ChatPanel />
                    </div>
                  </div>
                  <SettingsPanel />
                  <Toaster />
                </TaskProvider>
              </SettingsProvider>
            </ChatProvider>
          </AgentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
