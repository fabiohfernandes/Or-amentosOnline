// ============================================================================
// Home Page - Landing/Welcome Page
// NOVA Agent - Frontend Development Specialist
// ============================================================================

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { appConfig } from '@/config';

export const metadata: Metadata = {
  title: 'Início',
  description: 'Bem-vindo ao OrçamentosOnline - Plataforma moderna para criação e gestão de orçamentos',
};

const features = [
  'Criação de orçamentos profissionais',
  'Colaboração em tempo real',
  'Gestão de clientes e propostas',
  'Exportação em PDF e Excel',
  'Controle de acesso e permissões',
  'Histórico e versionamento',
];

export default function HomePage() {
  // In a real app, you might check auth status and redirect authenticated users
  // For now, we'll show a landing page

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <nav className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">O</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {appConfig.appName}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-secondary-600 hover:text-secondary-900 font-medium transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="btn-primary"
              >
                Começar grátis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Orçamentos profissionais
              <span className="text-primary-600 block">em minutos</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-secondary-600">
              Crie, gerencie e colabore em orçamentos de forma simples e profissional.
              Aumente sua produtividade e melhore a experiência dos seus clientes.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/register"
                className="btn-primary text-lg px-8 py-3"
              >
                Começar agora
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="text-sm font-semibold leading-6 text-secondary-900 hover:text-primary-600 transition-colors"
              >
                Saiba mais <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary-600">
                Recursos completos
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Tudo que você precisa para gerenciar orçamentos
              </p>
              <p className="mt-6 text-lg leading-8 text-secondary-600">
                Uma plataforma completa e moderna para criar, gerenciar e acompanhar
                seus orçamentos com eficiência e profissionalismo.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="card p-6 card-hover"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <CheckIcon className="h-6 w-6 text-success-500" />
                      </div>
                      <p className="text-secondary-900 font-medium">{feature}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Pronto para começar?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
                Junte-se a centenas de profissionais que já usam nossa plataforma
                para criar orçamentos incríveis.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/auth/register"
                  className="btn-secondary bg-white text-primary-600 hover:bg-primary-50"
                >
                  Criar conta grátis
                </Link>
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold leading-6 text-white hover:text-primary-100 transition-colors"
                >
                  Já tem conta? Entrar <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-secondary-200">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <p className="text-xs leading-5 text-secondary-500">
              Versão {appConfig.appVersion}
            </p>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-secondary-500">
              &copy; 2025 {appConfig.appName}. Desenvolvido com ❤️ pela equipe NOVA.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}