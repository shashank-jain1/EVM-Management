import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/components/common/LanguageContext';
import {
  LayoutDashboard,
  Cpu,
  Truck,
  Download,
  Users,
  BarChart3,
  Search,
  FileCode,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar({ collapsed, setCollapsed, onItemClick }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    if (onItemClick) onItemClick();
    navigate('/login');
  };

  // Nav Items configuration with roles
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER'] },
    { path: '/evm', label: 'EVM Inventory', icon: Cpu, roles: ['ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER'] },
    { path: '/dispatch', label: 'Dispatch (Send)', icon: Truck, roles: ['ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER'] },
    { path: '/receive', label: 'Receive Units', icon: Download, roles: ['ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER'] },
    { path: '/users', label: 'User Control', icon: Users, roles: ['ADMIN'] },
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['ADMIN', 'STATE_OFFICER'] },
    { path: '/search', label: 'Global Search', icon: Search, roles: ['ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER'] },
    { path: '/audit', label: 'Activity Logs', icon: FileCode, roles: ['ADMIN'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-20 flex flex-col bg-white/75 backdrop-blur-lg border-r border-slate-200/50 transition-all duration-300 shadow-[4px_0_24px_rgba(91,33,182,0.015)]",
        collapsed ? "w-[72px]" : "w-[265px]"
      )}
    >
      {/* Header / Logo */}
      <div className={clsx("flex items-center h-[68px] border-b border-slate-200/40", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <div className="flex items-center gap-2 overflow-hidden">
          <img src="/logo.png" className="w-8 h-8 object-contain shrink-0" alt="Logo" />
          {!collapsed && (
            <span className="font-sans font-black text-sm tracking-wider text-navy-950 uppercase whitespace-nowrap">
              {t('EVM')} <span className="text-saffron-500 font-extrabold">{t('System')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Collapse button floating absolutely on the right border */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200/80 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm hover:scale-105 transition-all cursor-pointer absolute top-5 -right-3 z-30"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 font-sans text-sm font-medium transition-all group relative cursor-pointer",
                  isActive
                    ? "bg-navy-50 text-navy-950 border-l-4 border-saffron-500 pl-2 rounded-r-xl rounded-l-none font-bold scale-[1.01] shadow-[0_2px_8px_rgba(29,42,68,0.04)]"
                    : "text-slate-500 border-l-4 border-transparent hover:bg-slate-50 hover:text-slate-800 hover:pl-3"
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{t(item.label)}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-navy-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
                  {t(item.label)}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>


    </aside>
  );
}
