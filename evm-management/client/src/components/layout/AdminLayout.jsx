import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import clsx from 'clsx';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Auto-collapse sidebar on smaller desktop screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfbfe] flex">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Sidebar - Mobile Drawer */}
      {mobileOpen && (
        <div className="relative z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[265px] bg-white shadow-2xl flex flex-col">
            <Sidebar collapsed={false} setCollapsed={() => {}} onItemClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={clsx(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          collapsed ? "md:pl-[72px]" : "md:pl-[265px]"
        )}
      >
        <Header setMobileOpen={setMobileOpen} />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-(screen-2xl) mx-auto w-full">
          <Outlet />
        </main>

        <footer className="py-4 text-center border-t border-slate-200/40 bg-white/40 backdrop-blur-md text-[11px] text-slate-400 font-sans font-medium mt-auto">
          EVM Inventory Management system &copy; {new Date().getFullYear()} Madhya Pradesh State Election Commission. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
