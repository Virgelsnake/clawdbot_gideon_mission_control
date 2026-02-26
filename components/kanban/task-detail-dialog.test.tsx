import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDetailDialog } from './task-detail-dialog';
import type { Task } from '@/types';

// Mock the dependencies
vi.mock('@/lib/task-context-doc-client', () => ({
  getTaskContextDoc: vi.fn().mockResolvedValue({ exists: false, path: '' }),
  createTaskContextDoc: vi.fn().mockResolvedValue({ path: '/test/path.md' }),
}));

vi.mock('@/lib/task-workflow-meta', () => ({
  getTaskWorkflowMeta: vi.fn().mockReturnValue({}),
  setTaskWorkflowMeta: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TaskDetailDialog Delete', () => {
  const mockTask: Task = {
    id: 'test-task-123',
    title: 'Test Project',
    description: 'Test description',
    column: 'in-progress',
    priority: 'high',
    assignee: 'Steve',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockOnOpenChange = vi.fn();
  const mockOnArchive = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders delete button in task detail dialog', () => {
    render(
      <TaskDetailDialog
        task={mockTask}
        open={true}
        onOpenChange={mockOnOpenChange}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('shows confirmation dialog when delete button clicked', async () => {
    render(
      <TaskDetailDialog
        task={mockTask}
        open={true}
        onOpenChange={mockOnOpenChange}
        onArchive={mockOnArchive}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/this will move the project to the archive/i)).toBeInTheDocument();
  });

  it('calls onArchive when delete confirmed', async () => {
    render(
      <TaskDetailDialog
        task={mockTask}
        open={true}
        onOpenChange={mockOnOpenChange}
        onArchive={mockOnArchive}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockOnArchive).toHaveBeenCalledWith('test-task-123');
    });
  });

  it('closes dialog after successful archive', async () => {
    render(
      <TaskDetailDialog
        task={mockTask}
        open={true}
        onOpenChange={mockOnOpenChange}
        onArchive={mockOnArchive}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('does not call onArchive when delete cancelled', () => {
    render(
      <TaskDetailDialog
        task={mockTask}
        open={true}
        onOpenChange={mockOnOpenChange}
        onArchive={mockOnArchive}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnArchive).not.toHaveBeenCalled();
  });

  it('shows error message if archive fails', async () => {
    const { toast } = await import('sonner');
    const mockFailingArchive = vi.fn().mockRejectedValue(new Error('Archive failed'));

    render(
      <TaskDetailDialog
        task={mockTask}
        open={true}
        onOpenChange={mockOnOpenChange}
        onArchive={mockFailingArchive}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to archive project');
    });
  });

  it('shows loading state while archiving', async () => {
    const slowArchive = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <TaskDetailDialog
        task={mockTask}
        open={true}
        onOpenChange={mockOnOpenChange}
        onArchive={slowArchive}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    expect(screen.getByText(/archiving/i)).toBeInTheDocument();
  });

  it('disables delete button when task is already archived', () => {
    const archivedTask = { ...mockTask, archived: true };

    render(
      <TaskDetailDialog
        task={archivedTask}
        open={true}
        onOpenChange={mockOnOpenChange}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });
});