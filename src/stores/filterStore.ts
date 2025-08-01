// zustand store for filter

import { create } from 'zustand';

interface FilterModalState {
  timeFilter: 'all' | 'day' | 'month' | 'year';
  selectedDate: Date;
  selectedDayDate: string;
  searchTerm: string;
  filterCategory: string;
}

interface FilterActionState {
  setTimeFilter: (timeFilter: 'all' | 'day' | 'month' | 'year') => void;
  setSelectedDate: (selectedDate: Date) => void;
  setSelectedDayDate: (selectedDayDate: string) => void;
  setSearchTerm: (searchTerm: string) => void;
  setFilterCategory: (filterCategory: string) => void;
}

interface FilterStore extends FilterModalState, FilterActionState {}

export const useFilterStore = create<FilterStore>((set) => ({
  timeFilter: 'all',
  selectedDate: new Date(),
  selectedDayDate: '',
  searchTerm: '',
  filterCategory: '전체',

  setTimeFilter: (timeFilter) => set({ timeFilter }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSelectedDayDate: (selectedDayDate) => set({ selectedDayDate }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
}));
