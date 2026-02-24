// Auto-reprioritisation hook for calendar threshold monitoring

import { useEffect, useCallback, useRef } from 'react';
import { useTask } from '@/contexts/task-context';
import { generateReprioritisationRecommendations, shouldAutoReprioritise } from './threshold-engine';
import { toast } from 'sonner';

// Track processed tasks across hook instances to prevent duplicate toasts
const processedTasks = new Set<string>();

export function useAutoReprioritisation() {
  const { tasks, updateTask } = useTask();
  const isProcessingRef = useRef(false);

  const checkAndApplyReprioritisation = useCallback(async () => {
    // Prevent concurrent execution
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

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

            // Log the auto-reprioritisation
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
          } catch (error) {
            console.error('Failed to auto-reprioritise:', rec.taskId, error);
          }
        }
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [tasks, updateTask]);

  // Check only on mount, not on every task change
  useEffect(() => {
    checkAndApplyReprioritisation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  return { checkAndApplyReprioritisation };
}
