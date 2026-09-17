import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-muted flex flex-col">
      <Navbar />
      <Sidebar />
      <div className="p-4 md:ml-64 pt-20 flex-1 flex flex-col">
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};
