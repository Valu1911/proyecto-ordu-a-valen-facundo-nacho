import React from 'react';
import { AnnouncementBar } from './AnnouncementBar.jsx';
import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';
import { AuthModal } from '../auth/AuthModal.jsx';

export function Layout({ children }) {
  return (
    <div className="sv-app-layout">
      <AnnouncementBar />
      <Header />
      <main className="sv-main-content">
        {children}
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
