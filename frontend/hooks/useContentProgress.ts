/**
 * useContentProgress.ts
 * React hook for tracking content progress (videos, lessons, etc).
 * Manages watch time, completion status, and resume position.
 */

import { useState, useCallback } from 'react';
import {
  updateContentProgress,
  markContentAsCompleted,
  ContentProgress,
} from '../services/studentSource';
import { useAuth } from '../contexts/AuthContext';

interface UseContentProgress {
  progress: ContentProgress | null;
  isLoading: boolean;
  error: string | null;
  updateProgress: (
    watchSeconds?: number,
    durationSeconds?: number,
    status?: 'not_started' | 'started' | 'in_progress' | 'completed'
  ) => Promise<void>;
  markCompleted: () => Promise<void>;
}

export function useContentProgress(
  contentId: string,
  unitId?: string,
  courseId?: string,
  contentType: string = 'video'
): UseContentProgress {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ContentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = useCallback(
    async (
      watchSeconds?: number,
      durationSeconds?: number,
      status: 'not_started' | 'started' | 'in_progress' | 'completed' = 'in_progress'
    ) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const updated = await updateContentProgress(
          contentId,
          unitId,
          courseId,
          contentType,
          status,
          watchSeconds,
          durationSeconds
        );
        setProgress(updated);
      } catch (err) {
        console.error('useContentProgress update error:', err);
        setError(err instanceof Error ? err.message : 'Failed to update progress');
      } finally {
        setIsLoading(false);
      }
    },
    [contentId, unitId, courseId, contentType, user]
  );

  const markCompleted = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const completed = await markContentAsCompleted(contentId, unitId, courseId, contentType);
      setProgress(completed);
    } catch (err) {
      console.error('useContentProgress mark completed error:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as completed');
    } finally {
      setIsLoading(false);
    }
  }, [contentId, unitId, courseId, contentType, user]);

  return {
    progress,
    isLoading,
    error,
    updateProgress,
    markCompleted,
  };
}
