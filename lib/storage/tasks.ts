import type { Task, Idea } from '@/types';

const STORAGE_KEY = 'gideon-tasks';
const IDEAS_KEY = 'gideon-ideas';

export function loadTasks(): Task[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const tasks = JSON.parse(stored) as Task[];
    return tasks;
  } catch {
    console.warn('Failed to load tasks from localStorage');
    return null;
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    console.warn('Failed to save tasks to localStorage');
  }
}

export function loadIdeas(): Idea[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(IDEAS_KEY);
    if (!stored) return null;
    
    const ideas = JSON.parse(stored) as Idea[];
    return ideas;
  } catch {
    console.warn('Failed to load ideas from localStorage');
    return null;
  }
}

export function saveIdeas(ideas: Idea[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  } catch {
    console.warn('Failed to save ideas to localStorage');
  }
}
