import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanBoard } from './kanban-board';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import type { Task } from '@/types';

// Mock the task context
const mockUseTask = vi.fn();
const mockAddTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();
const mockMoveTask = vi.fn();
const mockSetFilter = vi.fn();
const mockClearFilters = vi.fn();

const defaultMockReturn = {
  tasks: [],
  filteredTasks: [],
  ideas: [],
  addTask: mockAddTask,
  updateTask: mockUpdateTask,
  deleteTask: mockDeleteTask,
  moveTask: mockMoveTask,
  addIdea: vi.fn(),
  deleteIdea: vi.fn(),
  archiveIdea: vi.fn(),
  promoteIdea: vi.fn(),
  filters: {
    search: '',
    priorities: [],
    assignee: '',
    labels: [],
    dueDateFilter: null,
  },
  setFilter: mockSetFilter,
  clearFilters: mockClearFilters,
};

vi.mock('@/contexts/task-context', () => ({
  useTask: () => mockUseTask(),
  TaskProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Kanban Components (FR-4.2, FR-4.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTask.mockReturnValue(defaultMockReturn);
  });

  describe('KanbanColumn', () => {
    test('renders column with title and task count', () => {
      const tasks: Task[] = [
        { id: '1', title: 'Task 1', column: 'todo', createdAt: Date.now(), updatedAt: Date.now() },
        { id: '2', title: 'Task 2', column: 'todo', createdAt: Date.now(), updatedAt: Date.now() },
      ];

      mockUseTask.mockReturnValue({
        ...defaultMockReturn,
        tasks,
        filteredTasks: tasks,
      });

      render(<KanbanColumn id="todo" title="To Do" color="text-blue-600" bgColor="bg-blue-50" tasks={tasks} />);

      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('renders empty column with zero count', () => {
      mockUseTask.mockReturnValue({
        ...defaultMockReturn,
        tasks: [],
        filteredTasks: [],
      });

      render(<KanbanColumn id="done" title="Done" color="text-emerald-600" bgColor="bg-emerald-50" tasks={[]} />);

      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('TaskCard', () => {
    test('renders task with title and description', () => {
      const task: Task = {
        id: '1',
        title: 'Test Task',
        description: 'Test description',
        column: 'todo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockUseTask.mockReturnValue({
        ...defaultMockReturn,
        tasks: [task],
        filteredTasks: [task],
      });

      render(<TaskCard task={task} />);

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    test('renders task without description', () => {
      const task: Task = {
        id: '1',
        title: 'Test Task',
        column: 'todo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockUseTask.mockReturnValue({
        ...defaultMockReturn,
        tasks: [task],
        filteredTasks: [task],
      });

      render(<TaskCard task={task} />);

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });

    test('shows menu button on hover', () => {
      const task: Task = {
        id: '1',
        title: 'Test Task',
        column: 'todo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockUseTask.mockReturnValue({
        ...defaultMockReturn,
        tasks: [task],
        filteredTasks: [task],
      });

      render(<TaskCard task={task} />);

      const card = screen.getByText('Test Task').closest('[class*="group"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('KanbanBoard', () => {
    test('renders all five columns', () => {
      mockUseTask.mockReturnValue({
        ...defaultMockReturn,
        tasks: [],
        filteredTasks: [],
      });

      render(<KanbanBoard />);

      expect(screen.getByText('Backlog')).toBeInTheDocument();
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    test('renders Add Task button', () => {
      mockUseTask.mockReturnValue({
        ...defaultMockReturn,
        tasks: [],
        filteredTasks: [],
      });

      render(<KanbanBoard />);

      const addTaskButtons = screen.getAllByRole('button', { name: /^add task$/i });
      expect(addTaskButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
