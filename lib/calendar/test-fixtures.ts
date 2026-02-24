// Test fixtures for calendar threshold states
// Use these to verify UI rendering and logic across all urgency states

import type { Task } from '@/types';
import type { CalendarProject } from '@/types/calendar';
import { calculateThresholdState } from '@/lib/calendar/threshold-engine';

// Helper to create a task with a specific due date offset
function createTaskWithOffset(
  id: string,
  title: string,
  daysOffset: number,
  priority: Task['priority'] = 'medium'
): Task {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysOffset);
  dueDate.setHours(0, 0, 0, 0);

  return {
    id,
    title,
    description: `Test task due ${daysOffset >= 0 ? 'in' : ''} ${Math.abs(daysOffset)} days`,
    column: 'todo',
    priority,
    dueDate: dueDate.getTime(),
    assignee: 'gideon',
    labels: ['test', 'calendar'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Convert task to calendar project
function toCalendarProject(task: Task): CalendarProject {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
    priority: task.priority || 'medium',
    column: task.column,
    thresholdState: calculateThresholdState(task.dueDate),
    assignee: task.assignee,
    labels: task.labels,
  };
}

// --- Threshold State Fixtures ---

export const overdueTask = createTaskWithOffset('test-overdue', 'Overdue Task', -2, 'high');
export const overdueProject = toCalendarProject(overdueTask);

export const criticalTask = createTaskWithOffset('test-critical', 'Critical Task (Due Today)', 0, 'high');
export const criticalProject = toCalendarProject(criticalTask);

export const warningTask = createTaskWithOffset('test-warning', 'Warning Task (Due in 2 days)', 2, 'medium');
export const warningProject = toCalendarProject(warningTask);

export const watchTask = createTaskWithOffset('test-watch', 'Watch Task (Due in 5 days)', 5, 'low');
export const watchProject = toCalendarProject(watchTask);

export const normalTask = createTaskWithOffset('test-normal', 'Normal Task (Due in 14 days)', 14, 'low');
export const normalProject = toCalendarProject(normalTask);

export const noDueDateTask: Task = {
  id: 'test-no-due',
  title: 'No Due Date Task',
  description: 'Task without a due date',
  column: 'todo',
  priority: 'medium',
  assignee: 'gideon',
  labels: ['test'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
export const noDueDateProject = toCalendarProject(noDueDateTask);

// --- All Fixtures Array ---

export const allTestTasks: Task[] = [
  overdueTask,
  criticalTask,
  warningTask,
  watchTask,
  normalTask,
  noDueDateTask,
];

export const allTestProjects: CalendarProject[] = [
  overdueProject,
  criticalProject,
  warningProject,
  watchProject,
  normalProject,
  noDueDateProject,
];

// --- Edge Case Fixtures ---

// Same day move (drag to same date)
export const sameDayMoveTask = createTaskWithOffset('test-same-day', 'Same Day Move Test', 3, 'medium');

// Done column task (should be filtered out)
export const doneTask: Task = {
  ...createTaskWithOffset('test-done', 'Completed Task', -5, 'low'),
  column: 'done',
};
export const doneProject = toCalendarProject(doneTask);

// Auto-reprioritisation candidates
export const lowPriorityOverdueTask = createTaskWithOffset('test-low-overdue', 'Low Priority Overdue', -1, 'low');
export const mediumPriorityCriticalTask = createTaskWithOffset('test-med-critical', 'Medium Priority Critical', 0, 'medium');

// --- Validation Helpers ---

export function validateThresholdCalculations(): { state: string; expected: string; actual: string; pass: boolean }[] {
  const tests = [
    { task: overdueTask, expected: 'overdue' },
    { task: criticalTask, expected: 'critical' },
    { task: warningTask, expected: 'warning' },
    { task: watchTask, expected: 'watch' },
    { task: normalTask, expected: 'normal' },
    { task: noDueDateTask, expected: 'normal' },
  ];

  return tests.map(({ task, expected }) => {
    const actual = calculateThresholdState(task.dueDate);
    return {
      state: task.title,
      expected,
      actual,
      pass: actual === expected,
    };
  });
}

// --- Usage in Tests ---

/*
Example usage in a component test:

import { allTestProjects, validateThresholdCalculations } from '@/lib/calendar/test-fixtures';

// Render calendar with test data
<CalendarDayDetail date={new Date()} projects={allTestProjects} />

// Validate threshold calculations
const results = validateThresholdCalculations();
console.log(results);

// Expected output:
// [
//   { state: 'Overdue Task', expected: 'overdue', actual: 'overdue', pass: true },
//   { state: 'Critical Task (Due Today)', expected: 'critical', actual: 'critical', pass: true },
//   ...
// ]
*/
