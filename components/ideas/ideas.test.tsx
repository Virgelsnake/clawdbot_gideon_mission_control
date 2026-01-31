import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IdeasPanel } from './ideas-panel';
import type { Idea } from '@/types';

// Mock the task context
const mockUseTask = vi.fn();
const mockAddIdea = vi.fn();
const mockDeleteIdea = vi.fn();
const mockPromoteIdea = vi.fn();

vi.mock('@/contexts/task-context', () => ({
  useTask: () => mockUseTask(),
}));

describe('IdeasPanel (FR-5.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders empty state when no ideas', () => {
    mockUseTask.mockReturnValue({
      ideas: [],
      addIdea: mockAddIdea,
      deleteIdea: mockDeleteIdea,
      promoteIdea: mockPromoteIdea,
    });

    render(<IdeasPanel />);

    expect(screen.getByText(/no ideas yet/i)).toBeInTheDocument();
    expect(screen.getByText(/capture your ideas here/i)).toBeInTheDocument();
  });

  test('renders list of ideas', () => {
    const ideas: Idea[] = [
      { id: '1', content: 'First idea', createdAt: Date.now() },
      { id: '2', content: 'Second idea', createdAt: Date.now() },
    ];

    mockUseTask.mockReturnValue({
      ideas,
      addIdea: mockAddIdea,
      deleteIdea: mockDeleteIdea,
      promoteIdea: mockPromoteIdea,
    });

    render(<IdeasPanel />);

    expect(screen.getByText('First idea')).toBeInTheDocument();
    expect(screen.getByText('Second idea')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Count badge
  });

  test('calls addIdea when adding new idea', () => {
    mockUseTask.mockReturnValue({
      ideas: [],
      addIdea: mockAddIdea,
      deleteIdea: mockDeleteIdea,
      promoteIdea: mockPromoteIdea,
    });

    render(<IdeasPanel />);

    const input = screen.getByPlaceholderText(/quick add idea/i);
    fireEvent.change(input, { target: { value: 'New idea' } });
    
    const addButton = screen.getByRole('button', { name: '' }); // Plus icon button
    fireEvent.click(addButton);

    expect(mockAddIdea).toHaveBeenCalledWith('New idea');
  });

  test('calls promoteIdea when promote button clicked', () => {
    const ideas: Idea[] = [
      { id: '1', content: 'Promote me', createdAt: Date.now() },
    ];

    mockUseTask.mockReturnValue({
      ideas,
      addIdea: mockAddIdea,
      deleteIdea: mockDeleteIdea,
      promoteIdea: mockPromoteIdea,
    });

    render(<IdeasPanel />);

    // Find and click the promote button (arrow right icon)
    const promoteButton = screen.getByTitle('Promote to task');
    fireEvent.click(promoteButton);

    expect(mockPromoteIdea).toHaveBeenCalledWith('1');
  });

  test('calls deleteIdea when delete button clicked', () => {
    const ideas: Idea[] = [
      { id: '1', content: 'Delete me', createdAt: Date.now() },
    ];

    mockUseTask.mockReturnValue({
      ideas,
      addIdea: mockAddIdea,
      deleteIdea: mockDeleteIdea,
      promoteIdea: mockPromoteIdea,
    });

    render(<IdeasPanel />);

    const deleteButton = screen.getByTitle('Delete idea');
    fireEvent.click(deleteButton);

    expect(mockDeleteIdea).toHaveBeenCalledWith('1');
  });
});
