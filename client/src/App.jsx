import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { Catalog } from './pages/Catalog.jsx';
import { ProductDetail } from './pages/ProductDetail.jsx';
import { Favorites } from './pages/Favorites.jsx';
import { UserProfile } from './pages/UserProfile.jsx';
import { PublishItem } from './pages/PublishItem.jsx';
import { MyExchanges } from './pages/MyExchanges.jsx';
import { Chat } from './pages/Chat.jsx';
import { Admin } from './pages/Admin.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { useAuthStore } from './store/authStore.js';
import { authService } from './services/authService.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const { token, setUser, logout } = useAuthStore();

  // Validate session on app launch if token exists
  useEffect(() => {
    if (token) {
      authService.getMe().then((user) => {
        if (user) setUser(user);
      }).catch(() => {
        logout();
      });
    }

    const handleLogoutEvent = () => logout();
    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, [token, setUser, logout]);

  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/prenda/:id" element={<ProductDetail />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        <Route path="/favoritos" element={<Favorites />} />
        <Route path="/perfil/:id" element={<UserProfile />} />
        <Route path="/publicar" element={<PublishItem />} />
        <Route path="/mis-intercambios" element={<MyExchanges />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
