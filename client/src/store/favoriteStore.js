import { create } from 'zustand';

const STORAGE_KEY = 'sv_favorites';

function loadInitialFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useFavoriteStore = create((set, get) => ({
  favorites: loadInitialFavorites(),

  isFavorite: (productId) => {
    return get().favorites.some((item) => String(item.id) === String(productId));
  },

  toggleFavorite: (product) => {
    if (!product || !product.id) return;
    const current = get().favorites;
    const exists = current.some((item) => String(item.id) === String(product.id));

    let updated;
    if (exists) {
      updated = current.filter((item) => String(item.id) !== String(product.id));
    } else {
      updated = [product, ...current];
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving favorites to localStorage:', e);
    }

    set({ favorites: updated });
    return !exists;
  },

  removeFavorite: (productId) => {
    const updated = get().favorites.filter((item) => String(item.id) !== String(productId));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ favorites: updated });
  },

  clearFavorites: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ favorites: [] });
  },
}));
