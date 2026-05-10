/**
 * useStudentDashboard.ts
 * React hook for fetching complete student dashboard data.
 * Combines enrolled courses, progress, continue watching, and recent activity.
 */

import { useState, useEffect, useCallback } from 'react';
import { getStudentDashboard, StudentDashboardData } from '../services/studentSource';
import { useAuth } from '../contexts/AuthContext';

interface UseStudentDashboard {
  data: StudentDashboardData;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY_DASHBOARD: StudentDashboardData = {
  enrolledCourses: [],
  totalProgress: 0,
  continueWatching: [],
  recentActivity: [],
};

export function useStudentDashboard(): UseStudentDashboard {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData>(EMPTY_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!user) {
      setData(EMPTY_DASHBOARD);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const dashboardData = await getStudentDashboard();
      setData(dashboardData);
    } catch (err) {
      console.error('useStudentDashboard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setData(EMPTY_DASHBOARD);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}
