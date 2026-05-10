export type StudentPageState = 'unauthenticated' | 'loading' | 'error' | 'ready';

export function getStudentPageState(
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null,
): StudentPageState {
  if (!isAuthenticated) return 'unauthenticated';
  if (isLoading) return 'loading';
  if (error) return 'error';
  return 'ready';
}
