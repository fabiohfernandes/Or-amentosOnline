// ============================================================================
// Auth Layout - Authentication Pages Layout
// NOVA Agent - Frontend Development Specialist
// ============================================================================

import { Metadata } from 'next';
import Link from 'next/link';
import { appConfig } from '@/config';

export const metadata: Metadata = {
  title: 'Autenticação',
  description: 'Entre ou cadastre-se no OrçamentosOnline',
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-primary-600 lg:to-primary-800 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {appConfig.appName}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Gerencie seus orçamentos com facilidade
          </h1>

          <p className="text-primary-100 text-lg leading-relaxed mb-8">
            Crie propostas profissionais, colabore em tempo real e acompanhe
            o status dos seus orçamentos em uma plataforma moderna e intuitiva.
          </p>

          <div className="space-y-4 text-primary-100">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-primary-300 rounded-full" />
              <span>Interface moderna e responsiva</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-primary-300 rounded-full" />
              <span>Colaboração em tempo real</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-primary-300 rounded-full" />
              <span>Exportação profissional em PDF</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-primary-300 rounded-full" />
              <span>Controle de acesso e permissões</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-md mx-auto w-full">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {appConfig.appName}
              </span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}