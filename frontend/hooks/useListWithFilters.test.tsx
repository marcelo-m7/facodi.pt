import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useListWithFilters } from './useListWithFilters';

describe('useListWithFilters', () => {
  it('loads initial page and total', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      items: [{ id: 'a' }, { id: 'b' }],
      total: 5,
    });

    const { result } = renderHook(() =>
      useListWithFilters({
        pageSize: 2,
        initialFilters: { status: 'all' as const },
        fetchPage,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.total).toBe(5);
    expect(result.current.totalPages).toBe(3);
  });

  it('resets page to zero when filters are updated', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: [], total: 0 });

    const { result } = renderHook(() =>
      useListWithFilters({
        pageSize: 10,
        initialFilters: { status: 'all' as const },
        fetchPage,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPage(2);
      result.current.updateFilters({ status: 'pending' });
    });

    await waitFor(() => {
      expect(result.current.page).toBe(0);
      expect(result.current.filters.status).toBe('pending');
    });
  });
});
