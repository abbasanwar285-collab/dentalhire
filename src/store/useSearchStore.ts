// ============================================
// DentalHire - Search Store (Zustand)
// ============================================

import { create } from 'zustand';
import { SearchFilters, CV, MatchResult, EmploymentType } from '@/types';

interface SearchState {
    // Filters
    filters: SearchFilters;

    // Results
    results: MatchResult[];
    isLoading: boolean;
    totalResults: number;
    page: number;
    pageSize: number;

    // Favorites
    favorites: string[];

    // View mode
    viewMode: 'grid' | 'list';

    // Sort
    sortBy: 'match' | 'experience' | 'salary' | 'recent';

    // Actions
    setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
    setFilters: (filters: Partial<SearchFilters>) => void;
    clearFilters: () => void;

    setResults: (results: MatchResult[]) => void;
    setLoading: (loading: boolean) => void;
    setPage: (page: number) => void;

    addFavorite: (cvId: string) => void;
    removeFavorite: (cvId: string) => void;
    toggleFavorite: (cvId: string) => void;

    setViewMode: (mode: 'grid' | 'list') => void;
    setSortBy: (sort: 'match' | 'experience' | 'salary' | 'recent') => void;
}

const defaultFilters: SearchFilters = {
    query: '',
    location: '',
    salaryMin: undefined,
    salaryMax: undefined,
    experienceMin: undefined,
    experienceMax: undefined,
    skills: [],
    certifications: [],
    employmentType: [],
    languages: [],
    gender: undefined,
    verified: undefined,
};

export const useSearchStore = create<SearchState>((set, get) => ({
    // Initial state
    filters: defaultFilters,
    results: [],
    isLoading: false,
    totalResults: 0,
    page: 1,
    pageSize: 12,
    favorites: [],
    viewMode: 'grid',
    sortBy: 'match',

    // Filter actions  
    setFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value },
        page: 1, // Reset to first page on filter change
    })),

    setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
        page: 1,
    })),

    clearFilters: () => set({
        filters: defaultFilters,
        page: 1,
    }),

    // Results actions
    setResults: (results) => set({
        results,
        totalResults: results.length,
    }),

    setLoading: (loading) => set({ isLoading: loading }),

    setPage: (page) => set({ page }),

    // Favorites actions
    addFavorite: (cvId) => set((state) => ({
        favorites: state.favorites.includes(cvId)
            ? state.favorites
            : [...state.favorites, cvId]
    })),

    removeFavorite: (cvId) => set((state) => ({
        favorites: state.favorites.filter((id) => id !== cvId)
    })),

    toggleFavorite: (cvId) => {
        const { favorites } = get();
        if (favorites.includes(cvId)) {
            set({ favorites: favorites.filter((id) => id !== cvId) });
        } else {
            set({ favorites: [...favorites, cvId] });
        }
    },

    // View actions
    setViewMode: (mode) => set({ viewMode: mode }),
    setSortBy: (sort) => set({ sortBy: sort }),
}));

// Selector hooks for optimized rerenders
export const useSearchFilters = () => useSearchStore((state) => state.filters);
export const useSearchResults = () => useSearchStore((state) => state.results);
export const useFavorites = () => useSearchStore((state) => state.favorites);
