import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 overflow-auto p-4">
      <div className="container max-w-screen-2xl">
        {children}
      </div>
    </main>
  );
}
