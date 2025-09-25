// ============================================================================
// Dashboard Page - Main User Dashboard
// NOVA Agent - Frontend Development Specialist
// ============================================================================

import { Metadata } from 'next';
import Link from 'next/link';
import {
  PlusIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Painel principal do OrçamentosOnline - Gerencie seus orçamentos e clientes',
};

// Mock data for demonstration
const stats = [
  {
    id: 1,
    name: 'Orçamentos Ativos',
    value: '12',
    icon: DocumentTextIcon,
    change: '+4.75%',
    changeType: 'positive',
  },
  {
    id: 2,
    name: 'Clientes',
    value: '8',
    icon: UserGroupIcon,
    change: '+12.5%',
    changeType: 'positive',
  },
  {
    id: 3,
    name: 'Receita Mensal',
    value: 'R$ 45.2k',
    icon: ChartBarIcon,
    change: '+2.1%',
    changeType: 'positive',
  },
  {
    id: 4,
    name: 'Taxa de Conversão',
    value: '68%',
    icon: CheckCircleIcon,
    change: '-1.2%',
    changeType: 'negative',
  },
];

const recentProposals = [
  {
    id: 1,
    title: 'Website E-commerce - TechStore',
    client: 'João Silva',
    value: 'R$ 15.000',
    status: 'pending',
    date: '2025-01-15',
  },
  {
    id: 2,
    title: 'App Mobile - FitTrack',
    client: 'Maria Santos',
    value: 'R$ 25.000',
    status: 'approved',
    date: '2025-01-12',
  },
  {
    id: 3,
    title: 'Sistema Web - LogiFlow',
    client: 'Carlos Oliveira',
    value: 'R$ 32.000',
    status: 'draft',
    date: '2025-01-10',
  },
  {
    id: 4,
    title: 'Landing Page - StartupXYZ',
    client: 'Ana Costa',
    value: 'R$ 5.500',
    status: 'rejected',
    date: '2025-01-08',
  },
];

const getStatusBadge = (status: string) => {
  const styles = {
    pending: 'bg-warning-100 text-warning-800 border-warning-200',
    approved: 'bg-success-100 text-success-800 border-success-200',
    draft: 'bg-secondary-100 text-secondary-800 border-secondary-200',
    rejected: 'bg-danger-100 text-danger-800 border-danger-200',
  };

  const labels = {
    pending: 'Pendente',
    approved: 'Aprovado',
    draft: 'Rascunho',
    rejected: 'Rejeitado',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="h-4 w-4 text-warning-500" />;
    case 'approved':
      return <CheckCircleIcon className="h-4 w-4 text-success-500" />;
    case 'draft':
      return <DocumentTextIcon className="h-4 w-4 text-secondary-500" />;
    case 'rejected':
      return <ExclamationTriangleIcon className="h-4 w-4 text-danger-500" />;
    default:
      return <DocumentTextIcon className="h-4 w-4 text-secondary-500" />;
  }
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-secondary-600">
                Bem-vindo de volta! Aqui está um resumo dos seus orçamentos.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/proposals/new"
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Novo Orçamento
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.id} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-secondary-500 ml-2">desde o mês passado</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Proposals */}
        <div className="card">
          <div className="px-6 py-4 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Orçamentos Recentes</h2>
              <Link
                href="/proposals"
                className="text-sm text-primary-600 hover:text-primary-900 font-medium"
              >
                Ver todos
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Projeto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {recentProposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(proposal.status)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {proposal.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{proposal.client}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{proposal.value}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(proposal.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {new Date(proposal.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 transition-colors">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/proposals/new"
            className="card p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlusIcon className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Criar Orçamento</h3>
                <p className="text-sm text-secondary-600">
                  Comece um novo orçamento do zero
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/clients"
            className="card p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Gerenciar Clientes</h3>
                <p className="text-sm text-secondary-600">
                  Visualize e edite informações dos clientes
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/reports"
            className="card p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Relatórios</h3>
                <p className="text-sm text-secondary-600">
                  Analise sua performance e métricas
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}