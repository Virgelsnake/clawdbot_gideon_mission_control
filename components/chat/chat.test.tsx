import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './chat-input';
import { MessageList } from './message-list';
import { MessageBubble } from './message-bubble';
import type { Message } from '@/types';

// Mock the chat context
const mockUseChat = vi.fn();

vi.mock('@/contexts/chat-context', () => ({
  useChat: () => mockUseChat(),
}));

describe('Chat Components (FR-3.4, FR-3.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ChatInput', () => {
    test('renders input field and send button', () => {
      mockUseChat.mockReturnValue({
        isStreaming: false,
      });

      render(<ChatInput />);

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    test('calls onSendMessage when send button is clicked', () => {
      const onSendMessage = vi.fn();
      mockUseChat.mockReturnValue({
        isStreaming: false,
      });

      render(<ChatInput onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: 'Hello, Gideon!' } });
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      expect(onSendMessage).toHaveBeenCalledWith('Hello, Gideon!');
    });

    test('calls onSendMessage when Enter key is pressed', () => {
      const onSendMessage = vi.fn();
      mockUseChat.mockReturnValue({
        isStreaming: false,
      });

      render(<ChatInput onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSendMessage).toHaveBeenCalledWith('Test message');
    });

    test('disables input when streaming', () => {
      mockUseChat.mockReturnValue({
        isStreaming: true,
      });

      render(<ChatInput />);

      expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled();
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });
  });

  describe('MessageBubble', () => {
    test('renders user message with correct styling', () => {
      const userMessage: Message = {
        id: '1',
        role: 'user',
        content: 'Hello!',
        timestamp: Date.now(),
      };

      render(<MessageBubble message={userMessage} />);

      expect(screen.getByText('You')).toBeInTheDocument();
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });

    test('renders assistant message with correct styling', () => {
      const assistantMessage: Message = {
        id: '2',
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        timestamp: Date.now(),
      };

      render(<MessageBubble message={assistantMessage} />);

      expect(screen.getByText('Gideon')).toBeInTheDocument();
      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
    });
  });

  describe('MessageList', () => {
    test('shows placeholder when no messages', () => {
      mockUseChat.mockReturnValue({
        messages: [],
        isStreaming: false,
      });

      render(<MessageList />);

      expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
    });

    test('renders list of messages', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Hi there!', timestamp: Date.now() },
      ];

      mockUseChat.mockReturnValue({
        messages,
        isStreaming: false,
      });

      render(<MessageList />);

      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    test('shows streaming indicator when streaming', () => {
      mockUseChat.mockReturnValue({
        messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
        isStreaming: true,
      });

      render(<MessageList />);

      // The streaming indicator shows animated dots
      expect(document.querySelector('.animate-bounce')).toBeInTheDocument();
    });
  });
});
