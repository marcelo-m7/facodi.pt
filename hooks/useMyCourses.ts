/**
 * useMyCourses.ts
 * React hook for fetching and managing user's enrolled courses.
 * Follows usePlaylistVideos pattern: loading, error, data + setters.
 */

import { useState, useEffect } from 'react';
import { getMyCourses, CourseEnrollment } from '../services/studentSource';
import { useAuth } from '../contexts/AuthContext';

interface UseMyCourses {
  courses: CourseEnrollment[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMyCourses(): UseMyCourses {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    if (!user) {
      setCourses([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getMyCourses();
      setCourses(data);
    } catch (err) {
      console.error('useMyCourses error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user?.id]);

  return {
    courses,
    isLoading,
    error,
    refetch: fetchCourses,
  };
}
