import { useState, useCallback } from 'react';

interface PaginationState<T> {
  data: T[];
  nextCursor: string | null;
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
}

interface UseCursorPaginationReturn<T> extends PaginationState<T> {
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useCursorPagination<T>(
  fetchFunction: (cursor?: string, limit?: number) => Promise<{ data: T[]; nextCursor: string | null }>,
  limit = 20
): UseCursorPaginationReturn<T> {
  const [state, setState] = useState<PaginationState<T>>({
    data: [],
    nextCursor: null,
    loading: false,
    error: null,
    hasMore: true,
  });

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchFunction(state.nextCursor || undefined, limit);
      
      setState((prev) => ({
        ...prev,
        data: [...prev.data, ...result.data],
        nextCursor: result.nextCursor,
        hasMore: result.nextCursor !== null,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error as Error,
        loading: false,
      }));
    }
  }, [fetchFunction, state.nextCursor, state.loading, state.hasMore, limit]);

  const refresh = useCallback(async () => {
    setState({
      data: [],
      nextCursor: null,
      loading: true,
      error: null,
      hasMore: true,
    });

    try {
      const result = await fetchFunction(undefined, limit);
      
      setState({
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.nextCursor !== null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error as Error,
        loading: false,
      }));
    }
  }, [fetchFunction, limit]);

  const reset = useCallback(() => {
    setState({
      data: [],
      nextCursor: null,
      loading: false,
      error: null,
      hasMore: true,
    });
  }, []);

  return {
    ...state,
    loadMore,
    refresh,
    reset,
  };
}

