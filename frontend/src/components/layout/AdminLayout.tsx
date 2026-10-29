import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  LogOut,
  Share2,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const SIDEBAR_KEY = 'admin-sidebar-collapsed';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/social', label: 'Social Posts', icon: Share2, end: false },
];

export function AdminLayout() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  return (
    <div className="flex h-full bg-[#f5f5f7] text-neutral-900 antialiased">
      <aside
        className={`flex shrink-0 flex-col border-r border-neutral-200 bg-white transition-[width] duration-200 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-neutral-200 ${
            collapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-neutral-900">
                Admin Panel
              </p>
              <p className="truncate text-[12px] text-neutral-500">Smart Board</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <Icon size={18} aria-hidden="true" className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-neutral-200 p-3">
          <Link
            to="/"
            title={collapsed ? 'Back to app' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Home size={18} aria-hidden="true" className="shrink-0" />
            {!collapsed && <span>Back to app</span>}
          </Link>
          <button
            type="button"
            onClick={logout}
            title={collapsed ? 'Sign out' : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={18} aria-hidden="true" className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
          {!collapsed && user && (
            <div className="mt-2 truncate px-3 text-[12px] text-neutral-400">{user.email}</div>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
