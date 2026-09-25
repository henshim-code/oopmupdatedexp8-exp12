import React from 'react';
import Header from '../common/header/Header';
import Footer from '../common/footer/Footer';

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#FAF8F8] text-slate-900 antialiased">
      {/* KJSIT Maroon Header */}
      <Header />

      {/* Dynamic Main Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* KJSIT Maroon Footer */}
      <Footer />
    </div>
  );
}
