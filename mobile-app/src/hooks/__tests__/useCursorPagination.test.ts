import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCursorPagination } from '../useCursorPagination';

describe('useCursorPagination', () => {
  const mockFetchFunction = jest.fn();

  beforeEach(() => {
    mockFetchFunction.mockClear();
  });

  it('initializes with empty data', () => {
    const { result } = renderHook(() =>
      useCursorPagination(mockFetchFunction, 10)
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.nextCursor).toBeNull();
  });

  it('loads data on loadMore', async () => {
    const mockData = [{ id: 1 }, { id: 2 }];
    mockFetchFunction.mockResolvedValueOnce({
      data: mockData,
      nextCursor: 'cursor-1',
    });

    const { result } = renderHook(() =>
      useCursorPagination(mockFetchFunction, 10)
    );

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.nextCursor).toBe('cursor-1');
    expect(result.current.hasMore).toBe(true);
  });

  it('resets data on refresh', async () => {
    const mockData1 = [{ id: 1 }];
    const mockData2 = [{ id: 2 }];

    mockFetchFunction
      .mockResolvedValueOnce({ data: mockData1, nextCursor: null })
      .mockResolvedValueOnce({ data: mockData2, nextCursor: null });

    const { result } = renderHook(() =>
      useCursorPagination(mockFetchFunction, 10)
    );

    // First load
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Refresh
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });
  });
});

