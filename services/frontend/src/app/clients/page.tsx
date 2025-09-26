// ============================================================================
// Client Management Page - Complete Client Relationship Management
// NOVA Agent - Frontend Development Specialist
// MAESTRO Orchestrated - User Interface Enhancement Phase
// ============================================================================

import { Metadata } from 'next';
import Link from 'next/link';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Gestão de Clientes',
  description: 'Gerencie seu relacionamento com clientes - OrçamentosOnline',
};

// Mock data - In production, this would come from API
const clients = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao.silva@techstore.com.br',
    phone: '+55 11 99999-8888',
    company: 'TechStore Brasil',
    position: 'Diretor Comercial',
    location: 'São Paulo, SP',
    avatar: null,
    status: 'active',
    lastContact: '2025-01-18',
    totalProposals: 3,
    totalValue: 45000,
    conversionRate: 75,
    tags: ['E-commerce', 'Tecnologia', 'Premium'],
    notes: 'Cliente estratégico com potencial para projetos de longo prazo. Muito interessado em soluções inovadoras.',
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria@fitlife.com.br',
    phone: '+55 11 98888-7777',
    company: 'FitLife Academia',
    position: 'CEO',
    location: 'Rio de Janeiro, RJ',
    avatar: null,
    status: 'active',
    lastContact: '2025-01-15',
    totalProposals: 2,
    totalValue: 25000,
    conversionRate: 100,
    tags: ['Fitness', 'Mobile', 'Saúde'],
    notes: 'Muito profissional e objetiva. Gosta de cronogramas bem definidos e comunicação clara.',
  },
  {
    id: 3,
    name: 'Carlos Oliveira',
    email: 'carlos@translog.com.br',
    phone: '+55 11 97777-6666',
    company: 'TransLog Logística',
    position: 'Gerente de TI',
    location: 'Campinas, SP',
    avatar: null,
    status: 'active',
    lastContact: '2025-01-10',
    totalProposals: 1,
    totalValue: 32000,
    conversionRate: 0,
    tags: ['Logística', 'Sistema Web', 'Analytics'],
    notes: 'Ainda avaliando opções. Importante focar no ROI e benefícios mensuráveis.',
  },
  {
    id: 4,
    name: 'Ana Costa',
    email: 'ana@innovationhub.com',
    phone: '+55 11 96666-5555',
    company: 'Innovation Hub',
    position: 'Marketing Manager',
    location: 'Florianópolis, SC',
    avatar: null,
    status: 'inactive',
    lastContact: '2024-12-20',
    totalProposals: 4,
    totalValue: 18500,
    conversionRate: 25,
    tags: ['Startup', 'Fintech', 'Landing Pages'],
    notes: 'Cliente com orçamento limitado mas projetos interessantes. Considerar parcerias estratégicas.',
  },
  {
    id: 5,
    name: 'Roberto Lima',
    email: 'roberto@edtechsolutions.com',
    phone: '+55 11 95555-4444',
    company: 'EdTech Solutions',
    position: 'Founder',
    location: 'Belo Horizonte, MG',
    avatar: null,
    status: 'active',
    lastContact: '2025-01-12',
    totalProposals: 2,
    totalValue: 28000,
    conversionRate: 50,
    tags: ['Educação', 'EdTech', 'Plataforma'],
    notes: 'Visão clara do produto. Bom relacionamento e potencial para expansão do escopo.',
  },
  {
    id: 6,
    name: 'Patricia Mendes',
    email: 'patricia@analyticscorp.com',
    phone: '+55 11 94444-3333',
    company: 'Analytics Corp',
    position: 'Data Manager',
    location: 'Porto Alegre, RS',
    avatar: null,
    status: 'prospect',
    lastContact: '2025-01-05',
    totalProposals: 1,
    totalValue: 12000,
    conversionRate: 100,
    tags: ['Analytics', 'Dashboard', 'BI'],
    notes: 'Primeiro projeto já aprovado. Demonstrou interesse em projetos futuros de maior escala.',
  },
];

const getStatusConfig = (status: string) => {
  const configs = {
    active: {
      label: 'Ativo',
      badgeClass: 'bg-success-100 text-success-800 border-success-200',
      dotClass: 'bg-success-400',
    },
    inactive: {
      label: 'Inativo',
      badgeClass: 'bg-secondary-100 text-secondary-800 border-secondary-200',
      dotClass: 'bg-secondary-400',
    },
    prospect: {
      label: 'Prospecto',
      badgeClass: 'bg-primary-100 text-primary-800 border-primary-200',
      dotClass: 'bg-primary-400',
    },
  };

  return configs[status as keyof typeof configs] || configs.active;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
  }).format(value);
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

export default function ClientsPage() {
  const totalClients = clients.length;
  const activeClients = clients.filter(client => client.status === 'active').length;
  const totalValue = clients.reduce((sum, client) => sum + client.totalValue, 0);
  const avgConversionRate = clients.reduce((sum, client) => sum + client.conversionRate, 0) / clients.length;

  return (
    <div className="py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
            <p className="mt-1 text-sm text-secondary-600">
              Gerencie relacionamentos e acompanhe o histórico dos seus clientes
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn-outline flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filtros
            </button>
            <button className="btn-primary flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Cliente
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar clientes, empresas ou projetos..."
                className="input-field pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="input-field w-auto min-w-[120px]">
                <option>Todos os Status</option>
                <option>Ativo</option>
                <option>Inativo</option>
                <option>Prospecto</option>
              </select>
              <select className="input-field w-auto min-w-[120px]">
                <option>Todas as Regiões</option>
                <option>São Paulo</option>
                <option>Rio de Janeiro</option>
                <option>Minas Gerais</option>
                <option>Outros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Clientes Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{activeClients}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-success-500" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-success-500" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(avgConversionRate)}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-primary-500" />
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="grid gap-6">
          {clients.map((client) => {
            const statusConfig = getStatusConfig(client.status);

            return (
              <div key={client.id} className="card hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {getInitials(client.name)}
                          </span>
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {client.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-secondary-600 mb-2">
                              <span className="flex items-center">
                                <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                                {client.company}
                              </span>
                              <span className="flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                {client.location}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dotClass}`}></span>
                              {statusConfig.label}
                            </span>
                            <button className="p-1 text-secondary-400 hover:text-secondary-600">
                              <EllipsisVerticalIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-secondary-600 mb-3">
                          <span className="flex items-center">
                            <EnvelopeIcon className="h-4 w-4 mr-1" />
                            {client.email}
                          </span>
                          <span className="flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {client.phone}
                          </span>
                          <span className="font-medium text-secondary-700">
                            {client.position}
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {client.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary-100 text-secondary-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Notes */}
                        {client.notes && (
                          <div className="mb-4">
                            <p className="text-sm text-secondary-700 italic">
                              "{client.notes}"
                            </p>
                          </div>
                        )}

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-secondary-50 rounded-lg">
                            <p className="text-lg font-semibold text-gray-900">{client.totalProposals}</p>
                            <p className="text-xs text-secondary-600">Propostas</p>
                          </div>
                          <div className="text-center p-3 bg-secondary-50 rounded-lg">
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(client.totalValue)}</p>
                            <p className="text-xs text-secondary-600">Valor Total</p>
                          </div>
                          <div className="text-center p-3 bg-secondary-50 rounded-lg">
                            <p className="text-lg font-semibold text-gray-900">{client.conversionRate}%</p>
                            <p className="text-xs text-secondary-600">Conversão</p>
                          </div>
                          <div className="text-center p-3 bg-secondary-50 rounded-lg">
                            <p className="text-lg font-semibold text-gray-900">
                              {new Date(client.lastContact).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </p>
                            <p className="text-xs text-secondary-600">Último Contato</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                          <div className="flex items-center space-x-2">
                            <button className="btn-ghost p-2" title="Visualizar Detalhes">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button className="btn-ghost p-2" title="Editar Cliente">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button className="btn-ghost p-2" title="Nova Proposta">
                              <DocumentTextIcon className="h-4 w-4" />
                            </button>
                            <button className="btn-ghost p-2 text-danger-600 hover:bg-danger-50" title="Excluir">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="btn-outline text-sm px-3 py-1.5">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              Email
                            </button>
                            <button className="btn-primary text-sm px-3 py-1.5">
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Nova Proposta
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State - Hidden when there are clients */}
        {clients.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente encontrado</h3>
            <p className="mt-1 text-sm text-secondary-500">
              Comece adicionando seu primeiro cliente.
            </p>
            <div className="mt-6">
              <button className="btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Adicionar primeiro cliente
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center text-sm text-secondary-600">
            <span>Mostrando 1-{clients.length} de {clients.length} clientes</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="btn-outline px-3 py-2 text-sm">
              Anterior
            </button>
            <button className="btn-primary px-3 py-2 text-sm">
              1
            </button>
            <button className="btn-outline px-3 py-2 text-sm">
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}