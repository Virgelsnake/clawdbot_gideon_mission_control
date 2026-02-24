'use client';

import { useState } from 'react';
import { useTask } from '@/contexts/task-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Archive, Trash2, RotateCcw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ArchivePage() {
  const { tasks } = useTask();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Filter archived tasks (including soft-deleted)
  const archivedTasks = tasks.filter(task => task.archived || task.deleted);

  // Apply search filter
  const filteredTasks = archivedTasks.filter(task => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.assignee?.toLowerCase().includes(query)
    );
  });

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleRestore = async (taskId: string) => {
    try {
      // Import and call restore function
      const { restoreTask } = await import('@/lib/supabase/tasks');
      await restoreTask(taskId);
      toast.success('Task restored');
    } catch (error) {
      toast.error('Failed to restore task');
    }
  };

  const handlePermanentDelete = async (taskId: string) => {
    try {
      const { permanentlyDeleteTask } = await import('@/lib/supabase/tasks');
      await permanentlyDeleteTask(taskId);
      toast.success('Task permanently deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="h-6 w-6" />
            Archive
          </h1>
          <p className="text-muted-foreground">
            View and manage archived projects. Deleted projects can be permanently removed here.
          </p>
        </div>
        <Badge variant="secondary">
          {filteredTasks.length} archived
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search archived projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Archive List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No archived projects found</p>
            {searchQuery && <p className="text-sm">Try adjusting your search</p>}
          </Card>
        ) : (
          filteredTasks.map(task => {
            const isExpanded = expandedTasks.has(task.id);
            const isDeleted = task.deleted;

            return (
              <Card key={task.id} className="overflow-hidden">
                {/* Header - Always visible */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(task.id)}
                >
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <h3 className="font-semibold">{task.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {task.column}
                        </Badge>
                        {task.priority && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {task.priority}
                          </Badge>
                        )}
                        {isDeleted && (
                          <Badge variant="destructive" className="text-xs">
                            Deleted
                          </Badge>
                        )}
                        {task.archivedAt && (
                          <span>
                            Archived {new Date(task.archivedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isDeleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(task.id);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {isDeleted ? 'Delete Forever' : 'Delete'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {isDeleted ? 'Permanently Delete Project?' : 'Delete Project?'}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {isDeleted
                              ? 'This action cannot be undone. The project will be permanently removed from the database.'
                              : 'This will move the project to the deleted state. You can permanently delete it later from the archive.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handlePermanentDelete(task.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {isDeleted ? 'Permanently Delete' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-muted/30">
                    <div className="pt-4 space-y-3">
                      {task.description && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {task.description}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {task.assignee && (
                          <div>
                            <span className="text-muted-foreground">Assignee:</span>{' '}
                            {task.assignee}
                          </div>
                        )}
                        {task.dueDate && (
                          <div>
                            <span className="text-muted-foreground">Due Date:</span>{' '}
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Created:</span>{' '}
                          {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                        {task.archivedAt && (
                          <div>
                            <span className="text-muted-foreground">Archived:</span>{' '}
                            {new Date(task.archivedAt).toLocaleDateString()}
                          </div>
                        )}
                        {task.deletedAt && (
                          <div>
                            <span className="text-muted-foreground">Deleted:</span>{' '}
                            {new Date(task.deletedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Labels:</span>
                          {task.labels.map(label => (
                            <Badge key={label} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
