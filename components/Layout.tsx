import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdGroup,
  MdInventory2,
  MdShoppingCart,
  MdBarChart,
  MdLogout,
  MdCategory,
  MdCardGiftcard,
  MdPayments,
  MdReport,
  MdLightMode,
  MdDarkMode
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePaymentBadge } from '../hooks/usePaymentBadge';

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${active
      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-lg shadow-[var(--accent-primary)]/10'
      : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--accent-primary)] border border-transparent'
      }`}
  >
    <span className="text-xl"><Icon /></span>
    <p className="text-sm font-medium leading-normal">{label}</p>
  </Link>
);

const SidebarItemWithBadge = ({ to, icon: Icon, label, active, badgeCount, onClick }: {
  to: string,
  icon: any,
  label: string,
  active: boolean,
  badgeCount?: number,
  onClick?: () => void
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 relative ${active
      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-lg shadow-[var(--accent-primary)]/10'
      : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--accent-primary)] border border-transparent'
      }`}
  >
    <span className="text-xl relative">
      <Icon />
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-red-500 text-white rounded-full px-1 animate-pulse">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </span>
    <p className="text-sm font-medium leading-normal">{label}</p>
    {badgeCount !== undefined && badgeCount > 0 && (
      <span className="ml-auto flex items-center justify-center min-w-[22px] h-[22px] text-xs font-bold bg-red-500 text-white rounded-full">
        {badgeCount > 99 ? '99+' : badgeCount}
      </span>
    )}
  </Link>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { unreadCount, markAsRead } = usePaymentBadge();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="relative flex min-h-screen w-full flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex h-full min-h-screen w-full">
        {/* SideNavBar */}
        <aside className="sticky top-0 h-screen flex w-72 flex-col border-r p-5"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            backdropFilter: 'blur(12px)'
          }}>
          <div className="flex flex-col gap-6 h-full">
            {/* Logo */}
            <div className="flex items-center gap-4 p-3 rounded-xl"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 180, 216, 0.1)',
                border: '1px solid var(--border-color)'
              }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-xl shadow-lg"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #64ffda 0%, #00c2ff 100%)'
                    : 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
                  color: theme === 'dark' ? '#0a0f1a' : '#ffffff'
                }}>
                E+
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-normal" style={{ color: 'var(--text-primary)' }}>Admin</h1>
                <p className="text-sm font-medium leading-normal" style={{ color: 'var(--accent-primary)' }}>Stuplies Dashboard</p>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)'
              }}
            >
              <span className="text-xl">
                {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
              </span>
              <p className="text-sm font-medium leading-normal">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </p>
            </button>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 overflow-y-auto pr-2 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider px-4 mb-2" style={{ color: 'var(--text-secondary)' }}>Main Menu</p>
              <SidebarItem to="/" icon={MdDashboard} label="Overview" active={isActive('/')} />
              <SidebarItem to="/users" icon={MdGroup} label="Users" active={isActive('/users')} />
              <SidebarItem to="/categories" icon={MdCategory} label="Categories" active={isActive('/categories')} />
              <SidebarItem to="/products" icon={MdInventory2} label="Products" active={isActive('/products')} />
              <SidebarItem to="/packages" icon={MdCardGiftcard} label="Packages" active={isActive('/packages')} />
              <SidebarItemWithBadge
                to="/payments"
                icon={MdPayments}
                label="Payments"
                active={isActive('/payments')}
                badgeCount={unreadCount}
                onClick={markAsRead}
              />

              <div className="my-4 border-t" style={{ borderColor: 'var(--border-color)' }}></div>
              <p className="text-xs font-semibold uppercase tracking-wider px-4 mb-2" style={{ color: 'var(--text-secondary)' }}>Analytics & Reports</p>
              <SidebarItem to="/analytics" icon={MdBarChart} label="Analytics" active={isActive('/analytics')} />
              <SidebarItem to="/reports" icon={MdReport} label="Reports" active={isActive('/reports')} />
            </nav>

            {/* Logout */}
            <div className="mt-auto flex flex-col gap-2 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => {
                  try {
                    logout();
                  } catch (err) {
                    console.error('Logout failed', err);
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 hover:text-red-400 rounded-xl w-full text-left transition-all duration-300 border border-transparent hover:border-red-500/30"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="text-xl"><MdLogout /></span>
                <p className="text-sm font-medium leading-normal">Logout</p>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-8 overflow-y-auto h-screen"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(135deg, #0a0f1a 0%, #0f1627 50%, #0a0f1a 100%)'
              : 'linear-gradient(135deg, #f0f4f8 0%, #ffffff 50%, #f0f4f8 100%)'
          }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

