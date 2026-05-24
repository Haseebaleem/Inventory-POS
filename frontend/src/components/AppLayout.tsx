import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Tag,
  Receipt,
  Settings,
  ClipboardList,
  LogOut,
  Store,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import type { Role } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER'] },
  { to: '/pos', label: 'POS Counter', icon: ShoppingCart, roles: ['OWNER', 'CASHIER'] },
  { to: '/sales', label: 'Sales', icon: Receipt, roles: ['OWNER', 'CASHIER'] },
  { to: '/products', label: 'Products', icon: Package, roles: ['OWNER'] },
  { to: '/categories', label: 'Categories', icon: Tag, roles: ['OWNER'] },
  { to: '/staff', label: 'Staff', icon: Users, roles: ['OWNER'] },
  { to: '/business', label: 'Business', icon: Settings, roles: ['OWNER'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, roles: ['OWNER'] },
];

export default function AppLayout() {
  const { user, clear } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;
  const role = user.role;
  const visibleItems = navItems.filter((i) => i.roles.includes(role));

  const logout = () => {
    clear();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/20 flex">
      <aside className="w-60 bg-card border-r flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold leading-tight">Inventory POS</span>
            <span className="text-xs text-muted-foreground">{role}</span>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t text-xs text-muted-foreground">
          v1.0 · Phase 1
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b flex items-center justify-between px-6">
          <div className="text-sm text-muted-foreground">Welcome, {user.name}</div>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpen((v) => !v)}
              className="gap-2"
            >
              <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-sm">{user.email}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border bg-card shadow-md z-50">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
