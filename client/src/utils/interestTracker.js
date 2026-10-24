/**
 * Tracker de intereses y comportamiento de busqueda en Segunda Vuelta.
 * Almacena en localStorage las busquedas y estilos visitados para alimentar el motor de IA.
 */

const STORAGE_KEY = 'sv_user_interests';

export const interestTracker = {
  getInterests() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { searches: [], styles: {}, categories: {} };
    } catch {
      return { searches: [], styles: {}, categories: {} };
    }
  },

  recordSearch(query) {
    if (!query || typeof query !== 'string') return;
    const clean = query.trim().toLowerCase();
    if (clean.length < 2) return;

    const data = this.getInterests();
    // Guardar ultimas 10 busquedas unicas
    const updatedSearches = [clean, ...data.searches.filter((s) => s !== clean)].slice(0, 10);
    data.searches = updatedSearches;

    // Si coincide con estilos conocidos, incrementar contador
    const knownStyles = ['streetwear', 'y2k', 'retro', 'urban', 'deportivo', 'baggy', 'clasico', 'vintage'];
    for (const style of knownStyles) {
      if (clean.includes(style)) {
        data.styles[style] = (data.styles[style] || 0) + 2;
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  },

  recordProductView(product) {
    if (!product) return;
    const data = this.getInterests();

    if (product.style) {
      const s = product.style.toLowerCase();
      data.styles[s] = (data.styles[s] || 0) + 1;
    }

    if (product.category) {
      const c = product.category.toLowerCase();
      data.categories[c] = (data.categories[c] || 0) + 1;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  },

  getTopStyle() {
    const { styles } = this.getInterests();
    let top = 'streetwear';
    let max = 0;
    for (const [style, count] of Object.entries(styles)) {
      if (count > max) {
        max = count;
        top = style;
      }
    }
    return top;
  },

  getRecentSearches() {
    return this.getInterests().searches;
  },
};
