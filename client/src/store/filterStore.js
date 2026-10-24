import { create } from 'zustand';

const initialFilters = {
  gender: '',
  category: '',
  style: '',
  size: '',
  condition: '',
  search: '',
  distance: 50, // default 50km
  userLat: null,
  userLng: null,
  userCity: '',
  sort: 'newest', // 'newest' | 'distance' | 'views'
};

export const useFilterStore = create((set) => ({
  filters: { ...initialFilters },

  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value },
  })),

  setLocation: (lat, lng, city = '') => set((state) => ({
    filters: { ...state.filters, userLat: lat, userLng: lng, userCity: city },
  })),

  resetFilters: () => set({ filters: { ...initialFilters } }),
}));
