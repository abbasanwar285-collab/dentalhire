import React from 'react';

/**
 * Performance optimization utilities for React components
 */

/**
 * Hook to debounce a value
 * Useful for search inputs to avoid excessive re-renders and API calls
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook to throttle a function
 * Useful for scroll handlers and resize handlers
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 500
): T {
    const lastRun = React.useRef(Date.now());

    return React.useCallback(
        ((...args) => {
            const now = Date.now();
            if (now - lastRun.current >= delay) {
                callback(...args);
                lastRun.current = now;
            }
        }) as T,
        [callback, delay]
    );
}

/**
 * Hook to track if component is mounted
 * Prevents state updates on unmounted components
 */
export function useIsMounted(): () => boolean {
    const isMounted = React.useRef(true);

    React.useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return React.useCallback(() => isMounted.current, []);
}

/**
 * Hook for pagination
 * Returns paginated data and pagination controls
 */
export function usePagination<T>(
    data: T[],
    itemsPerPage: number = 20
) {
    const [currentPage, setCurrentPage] = React.useState(1);

    const totalPages = Math.ceil(data.length / itemsPerPage);

    const paginatedData = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    }, [data, currentPage, itemsPerPage]);

    const goToPage = React.useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    const nextPage = React.useCallback(() => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const prevPage = React.useCallback(() => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    }, []);

    return {
        currentPage,
        totalPages,
        paginatedData,
        goToPage,
        nextPage,
        prevPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
    };
}

/**
 * Hook for virtual scrolling (for large lists)
 * Returns visible items based on scroll position
 */
export function useVirtualScroll<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number
) {
    const [scrollTop, setScrollTop] = React.useState(0);

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
        visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
        items.length
    );

    const visibleItems = React.useMemo(
        () => items.slice(visibleStart, visibleEnd),
        [items, visibleStart, visibleEnd]
    );

    const totalHeight = items.length * itemHeight;
    const offsetY = visibleStart * itemHeight;

    return {
        visibleItems,
        totalHeight,
        offsetY,
        setScrollTop
    };
}

/**
 * Hook to measure component performance
 * Logs render time for debugging
 */
export function usePerformanceMonitor(componentName: string) {
    const renderCount = React.useRef(0);
    const startTime = React.useRef(performance.now());

    React.useEffect(() => {
        renderCount.current += 1;
        const endTime = performance.now();
        const renderTime = endTime - startTime.current;

        if (process.env.NODE_ENV === 'development') {
            console.log(
                `[Performance] ${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
            );
        }

        startTime.current = performance.now();
    });
}

/**
 * Memoized selector for complex calculations
 * Similar to reselect library
 */
export function createSelector<T, R>(
    selector: (data: T) => R,
    equalityFn: (a: R, b: R) => boolean = Object.is
) {
    let lastInput: T | undefined;
    let lastResult: R | undefined;

    return (data: T): R => {
        if (lastInput === undefined || !equalityFn(selector(data), lastResult!)) {
            lastInput = data;
            lastResult = selector(data);
        }
        return lastResult!;
    };
}

/**
 * Hook for lazy loading images
 */
export function useLazyImage(src: string) {
    const [imageSrc, setImageSrc] = React.useState<string | undefined>();
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setImageSrc(src);
            setIsLoading(false);
        };
        img.onerror = () => {
            setIsLoading(false);
        };
    }, [src]);

    return { imageSrc, isLoading };
}
