import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MapPin,
  Award,
  MessageSquare,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Éditions', href: '/admin/editions', icon: Calendar },
    { name: 'Le club', href: '/admin/club', icon: Users },
    { name: 'Infos pratiques', href: '/admin/practical-info', icon: MapPin },
    { name: 'Sponsors', href: '/admin/sponsors', icon: Award },
    { name: 'Formulaires', href: '/admin/forms', icon: MessageSquare },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Overlay mobile */}
        <div
          className={`fixed inset-0 bg-gray-900/60 z-40 lg:hidden transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform
                      lg:static lg:translate-x-0 lg:flex lg:flex-col lg:h-screen ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                      }`}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
            <span className="text-lg font-semibold">Admin Traîne-Savates</span>
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-800 p-4">
            <div className="text-xs text-gray-400 mb-2 truncate">{user?.email}</div>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                         text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="bg-white shadow-sm h-16 flex items-center px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-700 mr-4"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Administration</h1>
          </header>

          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
