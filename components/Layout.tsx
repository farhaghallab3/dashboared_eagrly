import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MdDashboard, 
  MdGroup, 
  MdInventory2, 
  MdShoppingCart, 
  MdBarChart, 
  MdSettings, 
  MdLogout,
  MdCategory,
  MdCardGiftcard,
  MdPayments
  ,MdReport
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
    <Link
    to={to}
    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
      active 
        ? 'bg-primary/20 text-primary' 
        : 'text-white/80 hover:bg-white/5'
    }`}
    >
    <span className="text-xl"><Icon /></span>
    <p className="text-sm font-medium leading-normal">{label}</p>
  </Link>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark/80 backdrop-blur-sm">
      <div className="flex h-full min-h-screen w-full">
        {/* SideNavBar */}
        <aside className="sticky top-0 h-screen flex w-64 flex-col border-r border-white/10 bg-background-dark/50 p-4">
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center gap-3 p-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xl">
                E+
              </div>
              <div className="flex flex-col">
                <h1 className="text-white text-base font-medium leading-normal">Admin</h1>
                <p className="text-primary/70 text-sm font-normal leading-normal">Eagrely</p>
              </div>
            </div>
            
            <nav className="flex flex-col gap-2 overflow-y-auto pr-2">
              <SidebarItem to="/" icon={MdDashboard} label="Overview" active={isActive('/')} />
              <SidebarItem to="/users" icon={MdGroup} label="Users" active={isActive('/users')} />
              <SidebarItem to="/categories" icon={MdCategory} label="Categories" active={isActive('/categories')} />
              <SidebarItem to="/products" icon={MdInventory2} label="Products" active={isActive('/products')} />
              <SidebarItem to="/packages" icon={MdCardGiftcard} label="Packages" active={isActive('/packages')} />
              <SidebarItem to="/payments" icon={MdPayments} label="Payments" active={isActive('/payments')} />
              <div className="my-2 border-t border-white/10"></div>
              <SidebarItem to="/analytics" icon={MdBarChart} label="Analytics" active={isActive('/analytics')} />
              <SidebarItem to="/settings" icon={MdSettings} label="Settings" active={isActive('/settings')} />
              <SidebarItem to="/reports" icon={MdReport} label="Reports" active={isActive('/reports')} />
            </nav>

            <div className="mt-auto flex flex-col gap-1">
              <button 
                onClick={() => {
                  try {
                    logout();
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error('Logout failed', err);
                  }
                }}
                className="flex items-center gap-3 px-3 py-2 text-white/80 hover:bg-white/5 rounded-lg w-full text-left"
              >
                <span className="text-xl"><MdLogout /></span>
                <p className="text-sm font-medium leading-normal">Logout</p>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto h-screen">
            {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
