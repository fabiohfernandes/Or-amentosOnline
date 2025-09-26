// ============================================================================
// Dashboard Layout Component - Main Navigation and Structure
// AURELIA Agent - Design System and UI Specialist
// MAESTRO Orchestrated - User Interface Enhancement Phase
// ============================================================================

'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { appConfig } from '@/config';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Propostas', href: '/proposals', icon: DocumentTextIcon },
  { name: 'Clientes', href: '/clients', icon: UserGroupIcon },
  { name: 'Relatórios', href: '/reports', icon: ChartBarIcon },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-6 bg-primary-600">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">O</span>
              </div>
              <span className="text-white font-semibold text-lg">
                {appConfig.appName}
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-primary-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile User Menu */}
          <div className="border-t border-secondary-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-secondary-500">{user?.email || 'email@example.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 rounded-lg"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-secondary-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 bg-primary-600">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">O</span>
              </div>
              <span className="text-white font-semibold text-lg">
                {appConfig.appName}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="border-t border-secondary-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">João Silva</p>
                <p className="text-xs text-secondary-500 truncate">joao@empresa.com</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-secondary-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-secondary-500 hover:text-secondary-700"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  type="search"
                  placeholder="Buscar propostas, clientes..."
                  className="input-field pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-secondary-500 hover:text-secondary-700">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-400 ring-2 ring-white" />
              </button>

              {/* Desktop user menu */}
              <div className="hidden lg:flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserCircleIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="hidden xl:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-secondary-500">{user?.email || 'email@example.com'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-secondary-500 hover:text-danger-600 transition-colors"
                  title="Sair"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-secondary-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-sm text-secondary-500">
              <div className="flex items-center space-x-6">
                <span>&copy; 2025 {appConfig.appName}</span>
                <span>Versão {appConfig.appVersion}</span>
              </div>
              <div className="flex items-center space-x-6">
                <Link href="/help" className="hover:text-secondary-900 transition-colors">
                  Ajuda
                </Link>
                <Link href="/privacy" className="hover:text-secondary-900 transition-colors">
                  Privacidade
                </Link>
                <Link href="/terms" className="hover:text-secondary-900 transition-colors">
                  Termos
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}