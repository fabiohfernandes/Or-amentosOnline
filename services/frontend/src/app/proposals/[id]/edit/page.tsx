'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  DocumentTextIcon,
  UserIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  EyeIcon,
  LockClosedIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';

interface ProposalData {
  id: string;
  proposal_name: string;
  client_name: string;
  job_name: string;
  presentation_url?: string;
  commercial_proposal_url?: string;
  scope_text?: string;
  terms_text?: string;
  client_username: string;
  status: string;
  proposal_value: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  public_token: string;
}

interface ProposalItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order?: number;
}

interface ProposalFormData {
  proposalName: string;
  clientName: string;
  jobName: string;
  presentationUrl: string;
  commercialProposalUrl: string;
  scopeText: string;
  termsText: string;
  clientUsername: string;
  clientPassword: string;
  proposalValue: string;
}

export default function EditProposal() {
  const params = useParams();
  const router = useRouter();
  const { tokens } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const [formData, setFormData] = useState<ProposalFormData>({
    proposalName: '',
    clientName: '',
    jobName: '',
    presentationUrl: '',
    commercialProposalUrl: '',
    scopeText: '',
    termsText: '',
    clientUsername: '',
    clientPassword: '',
    proposalValue: ''
  });

  // Load proposal data
  useEffect(() => {
    const loadProposal = async () => {
      if (!tokens?.accessToken || !params.id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/v1/proposals/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const proposalData = data.data.proposal;
          setProposal(proposalData);

          // Populate form with existing data
          setFormData({
            proposalName: proposalData.proposal_name || '',
            clientName: proposalData.client_name || '',
            jobName: proposalData.job_name || '',
            presentationUrl: proposalData.presentation_url || '',
            commercialProposalUrl: proposalData.commercial_proposal_url || '',
            scopeText: proposalData.scope_text || '',
            termsText: proposalData.terms_text || '',
            clientUsername: proposalData.client_username || '',
            clientPassword: '', // Password is not returned for security
            proposalValue: proposalData.proposal_value?.toString() || ''
          });
        } else {
          toast.error('Erro ao carregar proposta');
          router.push('/proposals');
        }
      } catch (error) {
        console.error('Error loading proposal:', error);
        toast.error('Erro ao carregar proposta');
        router.push('/proposals');
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [params.id, tokens, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokens?.accessToken || !proposal) return;

    try {
      setSaving(true);

      const updateData = {
        proposalName: formData.proposalName,
        clientName: formData.clientName,
        jobName: formData.jobName,
        presentationUrl: formData.presentationUrl,
        commercialProposalUrl: formData.commercialProposalUrl,
        scopeText: formData.scopeText,
        termsText: formData.termsText,
        proposalValue: parseFloat(formData.proposalValue) || 0
      };

      const response = await fetch(`/api/v1/proposals/${proposal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success('Proposta atualizada com sucesso!');
        router.push('/proposals');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao atualizar proposta');
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error('Erro ao atualizar proposta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Proposta não encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            A proposta que você está procurando não existe ou você não tem permissão para acessá-la.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/proposals')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Voltar para Propostas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/proposals')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <PencilIcon className="h-6 w-6 mr-2" />
                  Editar Proposta
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Edite os detalhes da proposta "{proposal.proposal_name}"
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                proposal.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {proposal.status === 'draft' ? 'Rascunho' :
                 proposal.status === 'pending' ? 'Pendente' :
                 proposal.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Proposal Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Informações da Proposta</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="proposalName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Proposta *
                </label>
                <input
                  type="text"
                  id="proposalName"
                  name="proposalName"
                  value={formData.proposalName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Proposta Site Institucional"
                />
              </div>

              <div>
                <label htmlFor="proposalValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor da Proposta *
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    id="proposalValue"
                    name="proposalValue"
                    value={formData.proposalValue}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="jobName" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição do Trabalho
              </label>
              <textarea
                id="jobName"
                name="jobName"
                value={formData.jobName}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva brevemente o trabalho a ser realizado..."
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Informações do Cliente</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome completo ou empresa"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Informações da Proposta:</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">ID:</span> {proposal.id}</p>
                  <p><span className="font-medium">Status:</span> {proposal.status}</p>
                  <p><span className="font-medium">Token Público:</span> {proposal.public_token}</p>
                  <p><span className="font-medium">Link de Acesso:</span>
                    <a
                      href={`/proposal/${proposal.public_token}`}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver Proposta
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Client Access Credentials */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-blue-900 flex items-center">
                  <LockClosedIcon className="h-4 w-4 mr-2" />
                  Credenciais de Acesso do Cliente
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {showPasswords ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="clientUsername" className="block text-sm font-medium text-gray-700 mb-1">
                    Usuário de Acesso
                  </label>
                  <input
                    type="text"
                    id="clientUsername"
                    name="clientUsername"
                    value={formData.clientUsername}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    placeholder="Nome de usuário para o cliente"
                  />
                </div>

                <div>
                  <label htmlFor="clientPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Senha de Acesso
                  </label>
                  <input
                    type={showPasswords ? "text" : "password"}
                    id="clientPassword"
                    name="clientPassword"
                    value={formData.clientPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    placeholder="Senha para o cliente"
                  />
                </div>
              </div>

              <p className="mt-2 text-xs text-blue-600">
                💡 Estas credenciais permitem que o cliente acesse e revise a proposta online.
              </p>
            </div>
          </div>

          {/* URLs and Links */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <GlobeAltIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Links e Apresentação</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="presentationUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Apresentação
                </label>
                <input
                  type="url"
                  id="presentationUrl"
                  name="presentationUrl"
                  value={formData.presentationUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://exemplo.com/apresentacao"
                />
              </div>

              <div>
                <label htmlFor="commercialProposalUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Proposta Comercial
                </label>
                <input
                  type="url"
                  id="commercialProposalUrl"
                  name="commercialProposalUrl"
                  value={formData.commercialProposalUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://exemplo.com/proposta"
                />
              </div>
            </div>
          </div>

          {/* Scope and Terms */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Escopo e Termos</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="scopeText" className="block text-sm font-medium text-gray-700 mb-2">
                  Escopo do Trabalho
                </label>
                <textarea
                  id="scopeText"
                  name="scopeText"
                  value={formData.scopeText}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva detalhadamente o escopo do trabalho..."
                />
              </div>

              <div>
                <label htmlFor="termsText" className="block text-sm font-medium text-gray-700 mb-2">
                  Termos e Condições
                </label>
                <textarea
                  id="termsText"
                  name="termsText"
                  value={formData.termsText}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Inclua termos de pagamento, prazos, garantias..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/proposals')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>

        {/* Proposal Metadata */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Proposta</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{proposal.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Valor</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(proposal.proposal_value)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Criada em</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Atualizada em</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(proposal.updated_at).toLocaleDateString('pt-BR')}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}