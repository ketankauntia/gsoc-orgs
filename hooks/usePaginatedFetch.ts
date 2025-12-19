import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for paginated data fetching
 * Handles loading states, pagination, and data fetching
 * 
 * @template T - Type of data items
 */

interface UsePaginatedFetchOptions<T> {
  /** Function to fetch data for a given page */
  fetchFn: (page: number) => Promise<{ data: T[]; totalPages: number; totalCount: number }>;
  /** Initial page number (default: 1) */
  initialPage?: number;
  /** Items per page (default: 20) */
  pageSize?: number;
  /** Dependencies that trigger refetch */
  dependencies?: unknown[];
}

interface UsePaginatedFetchReturn<T> {
  /** Current data items */
  data: T[];
  /** Current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total count of items */
  totalCount: number;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error object if fetch failed */
  error: Error | null;
  /** Whether there are more pages */
  hasMore: boolean;
  /** Function to load next page */
  loadMore: () => void;
  /** Function to go to specific page */
  goToPage: (page: number) => void;
  /** Function to refresh current page */
  refresh: () => void;
  /** Function to reset to first page */
  reset: () => void;
}

/**
 * @example
 * const { data, isLoading, loadMore, hasMore } = usePaginatedFetch({
 *   fetchFn: async (page) => {
 *     const res = await fetch(`/api/orgs?page=${page}`);
 *     return res.json();
 *   },
 *   pageSize: 20,
 * });
 */
export function usePaginatedFetch<T>({
  fetchFn,
  initialPage = 1,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pageSize: _pageSize = 20,
  dependencies = [],
}: UsePaginatedFetchOptions<T>): UsePaginatedFetchReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (page: number, append: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchFn(page);
        
        if (append) {
          setData((prev) => [...prev, ...result.data]);
        } else {
          setData(result.data);
        }
        
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
        setCurrentPage(page);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFn]
  );

  // Initial fetch and refetch on dependencies change
  useEffect(() => {
    fetchData(initialPage, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, initialPage, ...dependencies]);

  const loadMore = useCallback(() => {
    if (currentPage < totalPages && !isLoading) {
      fetchData(currentPage + 1, true);
    }
  }, [currentPage, totalPages, isLoading, fetchData]);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages && !isLoading) {
        fetchData(page, false);
      }
    },
    [totalPages, isLoading, fetchData]
  );

  const refresh = useCallback(() => {
    fetchData(currentPage, false);
  }, [currentPage, fetchData]);

  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(initialPage);
    fetchData(initialPage, false);
  }, [initialPage, fetchData]);

  return {
    data,
    currentPage,
    totalPages,
    totalCount,
    isLoading,
    error,
    hasMore: currentPage < totalPages,
    loadMore,
    goToPage,
    refresh,
    reset,
  };
}

