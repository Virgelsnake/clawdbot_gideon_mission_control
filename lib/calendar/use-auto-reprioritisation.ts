// Auto-reprioritisation hook for calendar threshold monitoring

import { useEffect, useCallback } from 'react';
import { useTask } from '@/contexts/task-context';
import { generateReprioritisationRecommendations, shouldAutoReprioritise } from './threshold-engine';
import { toast } from 'sonner';

export function useAutoReprioritisation() {
  const { tasks, updateTask } = useTask();

  const checkAndApplyReprioritisation = useCallback(async () => {
    const recommendations = generateReprioritisationRecommendations(tasks);

    for (const rec of recommendations) {
      if (shouldAutoReprioritise(rec.thresholdState)) {
        try {
          await updateTask(rec.taskId, { priority: rec.recommendedPriority });
          
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
  }, [tasks, updateTask]);

  // Check on mount and when tasks change
  useEffect(() => {
    checkAndApplyReprioritisation();
  }, [checkAndApplyReprioritisation]);

  return { checkAndApplyReprioritisation };
}
