'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
  showDateHeader?: string | null;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const markdownComponents: Components = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const inline = !match && !String(children).includes('\n');

    if (inline) {
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono" {...props}>
          {children}
        </code>
      );
    }

    return (
      <SyntaxHighlighter
        style={oneDark}
        language={match?.[1] ?? 'text'}
        PreTag="div"
        customStyle={{
          margin: '0.5rem 0',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
        }}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  },
  p({ children }) {
    return <p className="mb-2 last:mb-0">{children}</p>;
  },
  ul({ children }) {
    return <ul className="mb-2 ml-4 list-disc last:mb-0">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="mb-2 ml-4 list-decimal last:mb-0">{children}</ol>;
  },
  li({ children }) {
    return <li className="mb-0.5">{children}</li>;
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground">
        {children}
      </blockquote>
    );
  },
};

export function MessageBubble({ message, showDateHeader }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <>
      {showDateHeader && (
        <div className="flex items-center gap-2 py-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {showDateHeader}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}
      <div
        className={cn(
          'flex gap-3 p-3 rounded-lg',
          isUser ? 'flex-row-reverse bg-muted/50' : 'flex-row bg-background'
        )}
      >
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        <div className={cn('flex flex-col gap-1 min-w-0 flex-1', isUser ? 'items-end' : 'items-start')}>
          <div className={cn('flex items-center gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
            <span className="text-xs font-medium text-muted-foreground">
              {isUser ? 'You' : 'Gideon'}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {formatTime(message.timestamp)}
            </span>
          </div>
          <div
            className={cn(
              'text-sm leading-relaxed max-w-full overflow-hidden',
              isUser ? 'text-right' : 'text-left'
            )}
          >
            {isUser ? (
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {message.content || '...'}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
