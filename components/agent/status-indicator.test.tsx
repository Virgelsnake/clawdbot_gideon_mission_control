import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from './status-indicator';
import type { AgentStatus } from '@/types';

// Mock the agent context to control the status value
const mockUseAgent = vi.fn();

vi.mock('@/contexts/agent-context', () => ({
  useAgent: () => mockUseAgent(),
}));

describe('StatusIndicator (FR-1.1)', () => {
  const renderWithStatus = (status: AgentStatus, currentModel: string = 'claude-3-5-sonnet') => {
    mockUseAgent.mockReturnValue({
      status,
      currentModel,
      modelList: ['claude-3-5-sonnet', 'gpt-4o'],
      setStatus: vi.fn(),
      setCurrentModel: vi.fn(),
    });
    return render(<StatusIndicator />);
  };

  test('renders idle status with gray color', () => {
    renderWithStatus('idle');
    
    const statusDot = screen.getByText('Idle').previousElementSibling;
    expect(statusDot).toHaveClass('bg-gray-500');
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  test('renders thinking status with yellow color', () => {
    renderWithStatus('thinking');
    
    const statusDot = screen.getByText('Thinking').previousElementSibling;
    expect(statusDot).toHaveClass('bg-yellow-500');
    expect(screen.getByText('Thinking')).toBeInTheDocument();
  });

  test('renders active status with green color', () => {
    renderWithStatus('active');
    
    const statusDot = screen.getByText('Active').previousElementSibling;
    expect(statusDot).toHaveClass('bg-green-500');
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('renders resting status with red color', () => {
    renderWithStatus('resting');
    
    const statusDot = screen.getByText('Resting').previousElementSibling;
    expect(statusDot).toHaveClass('bg-red-500');
    expect(screen.getByText('Resting')).toBeInTheDocument();
  });

  test('displays current model name beneath indicator', () => {
    renderWithStatus('idle', 'gpt-4o');
    
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
  });
});
