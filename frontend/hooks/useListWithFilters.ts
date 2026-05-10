import { useCallback, useEffect, useMemo, useState } from 'react';

export interface PaginatedItems<T> {
  items: T[];
  total: number;
}

interface UseListWithFiltersOptions<TItem, TFilters> {
  pageSize: number;
  initialFilters: TFilters;
  fetchPage: (params: { filters: TFilters; limit: number; offset: number }) => Promise<PaginatedItems<TItem>>;
}

type FilterUpdate<TFilters> = TFilters | ((prev: TFilters) => TFilters);

export function useListWithFilters<TItem, TFilters>({
  pageSize,
  initialFilters,
  fetchPage,
}: UseListWithFiltersOptions<TItem, TFilters>) {
  const [items, setItems] = useState<TItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFiltersState] = useState<TFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchPage({
        filters,
        limit: pageSize,
        offset: page * pageSize,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error('[useListWithFilters] load error', err);
      setError('Erro ao carregar dados.');
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, filters, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilters = useCallback((update: FilterUpdate<TFilters>) => {
    setPage(0);
    setFiltersState((prev) =>
      typeof update === 'function' ? (update as (current: TFilters) => TFilters)(prev) : update,
    );
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  return {
    items,
    total,
    totalPages,
    page,
    setPage,
    filters,
    updateFilters,
    isLoading,
    error,
    reload: load,
  };
}
