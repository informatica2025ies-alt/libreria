import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, BookOpen, Users, LayoutDashboard, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onChangeView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isAdmin = user.role === UserRole.ADMIN;

  const NavItem = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-1 text-sm font-medium transition-colors rounded-lg ${
        currentView === view
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-64 bg-white border-r border-slate-200 md:flex md:flex-col">
        <div className="flex items-center h-16 px-6 border-b border-slate-100">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <span className="ml-3 text-lg font-bold text-slate-800">Librería IA</span>
        </div>
        
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          {isAdmin ? (
            <>
              <div className="mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wider px-4">
                Administración
              </div>
              <NavItem view="admin-books" icon={LayoutDashboard} label="Gestión de Libros" />
              <NavItem view="admin-users" icon={Users} label="Gestión de Usuarios" />
            </>
          ) : (
            <>
              <div className="mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wider px-4">
                Explorar
              </div>
              <NavItem view="user-home" icon={BookOpen} label="Catálogo" />
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center px-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-slate-700 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 transition-colors rounded-md hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 md:hidden">
          <div className="flex items-center">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span className="ml-2 text-lg font-bold text-slate-800">Librería</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-800 bg-opacity-50 md:hidden">
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
              <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
                <span className="text-lg font-bold text-slate-800">Menú</span>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              <div className="p-4">
                {isAdmin ? (
                    <>
                    <NavItem view="admin-books" icon={LayoutDashboard} label="Gestión de Libros" />
                    <NavItem view="admin-users" icon={Users} label="Gestión de Usuarios" />
                    </>
                ) : (
                    <NavItem view="user-home" icon={BookOpen} label="Catálogo" />
                )}
                <div className="my-4 border-t border-slate-100" />
                <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 rounded-md hover:bg-red-50"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
