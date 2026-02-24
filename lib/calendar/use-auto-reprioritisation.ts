// Auto-reprioritisation hook for calendar threshold monitoring

import { useEffect, useCallback, useRef } from 'react';
import { useTask } from '@/contexts/task-context';
import { useSettings } from '@/contexts/settings-context';
import { generateReprioritisationRecommendations, shouldAutoReprioritise } from './threshold-engine';
import { logActivity } from '@/lib/supabase/activity-log';
import { toast } from 'sonner';

// Track processed tasks across hook instances to prevent duplicate toasts
const processedTasks = new Set<string>();

export interface ReprioritisationResult {
  taskId: string;
  success: boolean;
  fromPriority: string;
  toPriority: string;
  reason: string;
}

export function useAutoReprioritisation() {
  const { tasks, updateTask } = useTask();
  const { settings } = useSettings();
  const isProcessingRef = useRef(false);

  // Check if feature is enabled
  const isEnabled = settings.features.calendarV2Enabled && settings.features.calendarAutoReprioritiseEnabled;

  const checkAndApplyReprioritisation = useCallback(async (): Promise<ReprioritisationResult[]> => {
    // Prevent concurrent execution
    if (isProcessingRef.current) return [];
    isProcessingRef.current = true;

    const results: ReprioritisationResult[] = [];

    try {
      const recommendations = generateReprioritisationRecommendations(tasks);

      for (const rec of recommendations) {
        // Skip if already processed this session
        if (processedTasks.has(rec.taskId)) continue;
        
        if (shouldAutoReprioritise(rec.thresholdState)) {
          try {
            await updateTask(rec.taskId, { priority: rec.recommendedPriority });
            
            // Mark as processed to prevent duplicate toasts
            processedTasks.add(rec.taskId);

            // Log to activity log for audit trail
            await logActivity({
              actor: 'system',
              action: 'task_updated',
              entityType: 'task',
              entityId: rec.taskId,
              changes: {
                priority: { old: rec.currentPriority, new: rec.recommendedPriority },
              },
              metadata: {
                reason: rec.reason,
                thresholdState: rec.thresholdState,
                autoReprioritised: true,
              },
            });

            // Log to console for debugging
            console.log('Auto-reprioritised:', {
              taskId: rec.taskId,
              from: rec.currentPriority,
              to: rec.recommendedPriority,
              reason: rec.reason,
            });

            toast.info(
              `Auto-reprioritised: ${rec.reason}`,
              { description: `Priority changed to ${rec.recommendedPriority}` }
            );

            results.push({
              taskId: rec.taskId,
              success: true,
              fromPriority: rec.currentPriority,
              toPriority: rec.recommendedPriority,
              reason: rec.reason,
            });
          } catch (error) {
            console.error('Failed to auto-reprioritise:', rec.taskId, error);
            results.push({
              taskId: rec.taskId,
              success: false,
              fromPriority: rec.currentPriority,
              toPriority: rec.recommendedPriority,
              reason: rec.reason,
            });
          }
        }
      }
    } finally {
      isProcessingRef.current = false;
    }

    return results;
  }, [tasks, updateTask]);

  // Check only on mount if feature is enabled
  useEffect(() => {
    if (isEnabled) {
      checkAndApplyReprioritisation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]); // Re-run if feature flag changes

  return { checkAndApplyReprioritisation, isEnabled };
}
