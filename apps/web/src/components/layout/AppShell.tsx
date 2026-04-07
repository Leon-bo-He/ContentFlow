import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { MobileBottomNav } from './MobileBottomNav.js';

export function AppShell() {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 inset-x-0 md:hidden border-t border-gray-200">
        <MobileBottomNav />
      </div>
    </div>
  );
}
