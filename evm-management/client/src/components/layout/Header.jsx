import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LogOut, User, Bell, ChevronRight, Menu } from 'lucide-react';
import { useTranslation } from '@/components/common/LanguageContext';

const routeMap = {
  '/dashboard': 'Dashboard',
  '/evm': 'EVM Inventory',
  '/evm/register': 'Register EVM',
  '/dispatch': 'Send EVM Batch',
  '/receive': 'Receive EVM Units',
  '/users': 'User Management',
  '/reports': 'Reports & Analytics',
  '/search': 'Search EVM Units',
  '/audit': 'System Activity Logs',
};

export default function Header({ setMobileOpen }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { language, setLanguage, t } = useTranslation();

  const getPageTitle = () => {
    if (pathname.startsWith('/evm/')) {
      if (pathname.includes('/register')) return 'Register New EVM';
      return 'EVM Lifecycle Details';
    }
    if (pathname.startsWith('/dispatch/')) {
      return 'Dispatch Batch Summary';
    }
    return routeMap[pathname] || 'EVM Management';
  };

  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'EVM Main', path: '/dashboard' }];

    let currentPath = '';
    paths.forEach((p, idx) => {
      currentPath += `/${p}`;
      let label = p.charAt(0).toUpperCase() + p.slice(1);
      if (p === 'evm') label = 'Inventory';
      else if (p === 'dispatch') label = 'Dispatches';
      else if (routeMap[currentPath]) label = routeMap[currentPath].split(' ')[0];

      breadcrumbs.push({ label, path: currentPath });
    });

    // Clean duplicates if any (like EVM Main vs Dashboard)
    return breadcrumbs.slice(pathname === '/dashboard' ? 1 : 0);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-[68px] px-4 md:px-6 bg-white/70 backdrop-blur-md border-b border-slate-200/40 shadow-[0_2px_12px_rgba(91,33,182,0.015)]">
      {/* Left side: Hamburger (mobile) + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(prev => !prev)}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <nav className="hidden sm:flex items-center space-x-1.5 text-[11px] font-sans text-slate-400">
            {generateBreadcrumbs().map((b, idx) => {
              const isLast = idx === generateBreadcrumbs().length - 1;
              return (
                <div key={b.path} className="flex items-center">
                  {idx > 0 && <ChevronRight size={10} className="mx-1 text-slate-300 shrink-0" />}
                  {isLast ? (
                    <span className="font-medium text-slate-600 truncate max-w-[120px] md:max-w-[200px]">
                      {t(b.label)}
                    </span>
                  ) : (
                    <Link to={b.path} className="hover:text-blue-600 transition-colors shrink-0">
                      {t(b.label)}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
          <h1 className="mt-0.5 text-sm sm:text-base md:text-[17px] font-extrabold font-sans text-slate-900 tracking-tight">
            {t(getPageTitle())}
          </h1>
        </div>
      </div>

      {/* Right side: Actions / Profile */}
      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-slate-100 hover:bg-saffron-50 hover:text-saffron-600 border border-slate-200 hover:border-saffron-300 transition-all cursor-pointer select-none font-mono uppercase tracking-wide shrink-0"
        >
          {language === 'en' ? 'हिन्दी' : 'English'}
        </button>

        {/* Notification indicator */}
        <button
          className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="View notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-saffron-500 border-2 border-white animate-pulse" />
        </button>

        {/* User profile dropdown summary */}
        <div className="flex items-center gap-3.5 pl-3 border-l border-slate-200/80">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-slate-700 truncate leading-tight">
              {user?.fullName || 'Officer'}
            </p>
            <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wider">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
