'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  DocumentTextIcon,
  UserIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  EyeIcon,
  LockClosedIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../../../store/auth';

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

const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const generateUsername = (clientName: string): string => {
  const normalized = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const year = new Date().getFullYear();
  return `${normalized}_${year}`;
};

export default function CreateProposal() {
  const router = useRouter();
  const { user, tokens } = useAuthStore();

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

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdProposal, setCreatedProposal] = useState<any>(null);

  // Template texts
  const defaultScopeTemplate = `**Escopo do Projeto:**

1. **Desenvolvimento/Serviços Incluídos:**
   - [Descreva os principais serviços ou produtos]
   - [Liste as funcionalidades principais]
   - [Mencione entregas específicas]

2. **Processo de Trabalho:**
   - Prazo: [XX] dias
   - [Descreva metodologia]
   - [Mencione etapas principais]

3. **O que está incluído:**
   - [Liste tudo que está incluído]
   - [Suporte pós-entrega]
   - [Garantias oferecidas]

4. **Responsabilidades do Cliente:**
   - [O que o cliente deve fornecer]
   - [Prazos para aprovações]
   - [Materiais necessários]`;

  const defaultTermsTemplate = `**Termos e Condições:**

**1. Pagamento:**
- [XX]% na assinatura do contrato
- [XX]% na entrega final do projeto
- Forma de pagamento: [PIX/Transferência/Boleto]

**2. Prazos:**
- Início: Imediatamente após confirmação
- Entrega: [XX] dias corridos
- Revisões: Até [XX] rodadas de ajustes incluídas

**3. Garantia:**
- [XX] dias de garantia contra defeitos
- Suporte técnico por [XX] meses incluído

**4. Responsabilidades do Cliente:**
- Fornecimento de conteúdo e materiais
- Aprovações em até 48h
- Pagamento conforme cronograma acordado

**5. Propriedade Intelectual:**
- [Defina a propriedade do trabalho realizado]
- [Mencione direitos autorais]

**Valor Total: R$ [VALOR]**

*Ao clicar em "Aceitar e Fechar Negócio", você concorda com todos os termos acima.*`;

  const handleInputChange = (field: keyof ProposalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate username when client name changes
    if (field === 'clientName' && value) {
      const username = generateUsername(value);
      setFormData(prev => ({ ...prev, clientUsername: username }));
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData(prev => ({ ...prev, clientPassword: newPassword }));
    toast.success('Senha gerada automaticamente');
  };

  const loadTemplate = (field: 'scopeText' | 'termsText') => {
    const template = field === 'scopeText' ? defaultScopeTemplate : defaultTermsTemplate;
    setFormData(prev => ({ ...prev, [field]: template }));
    toast.success('Template carregado!');
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = {
      proposalName: 'Nome da proposta',
      clientName: 'Nome do cliente',
      jobName: 'Nome do trabalho',
      scopeText: 'Texto do escopo',
      termsText: 'Termos e condições',
      clientUsername: 'Nome de usuário do cliente',
      clientPassword: 'Senha do cliente'
    };

    const errors: string[] = [];

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field as keyof ProposalFormData]?.trim()) {
        errors.push(`${label} é obrigatório`);
      }
    });

    // Validate URLs if provided
    if (formData.presentationUrl && !validateUrl(formData.presentationUrl)) {
      errors.push('URL da apresentação inválida');
    }

    if (formData.commercialProposalUrl && !validateUrl(formData.commercialProposalUrl)) {
      errors.push('URL da proposta comercial inválida');
    }

    // Validate username format
    if (formData.clientUsername && !/^[a-zA-Z0-9_]+$/.test(formData.clientUsername)) {
      errors.push('Nome de usuário deve conter apenas letras, números e underscore');
    }

    // Validate password strength
    if (formData.clientPassword.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          proposalName: formData.proposalName.trim(),
          clientName: formData.clientName.trim(),
          jobName: formData.jobName.trim(),
          presentationUrl: formData.presentationUrl.trim() || null,
          commercialProposalUrl: formData.commercialProposalUrl.trim() || null,
          scopeText: formData.scopeText.trim(),
          termsText: formData.termsText.trim(),
          clientUsername: formData.clientUsername.trim(),
          clientPassword: formData.clientPassword,
          proposalValue: formData.proposalValue ? parseFloat(formData.proposalValue) : 0
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Proposta criada com sucesso!');
        setCreatedProposal(data.data.proposal);
        // Don't redirect immediately, show success screen first
      } else {
        if (data.errors) {
          data.errors.forEach((error: string) => toast.error(error));
        } else {
          toast.error(data.error || 'Erro ao criar proposta');
        }
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Erro ao criar proposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // Show success screen after proposal creation
  if (createdProposal) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <h1 className="text-2xl font-bold text-green-900 flex items-center">
                <CheckCircleIcon className="h-7 w-7 text-green-600 mr-3" />
                Proposta Criada com Sucesso!
              </h1>
              <p className="mt-1 text-sm text-green-700">
                Sua proposta foi criada e está pronta para ser enviada ao cliente
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Proposal Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes da Proposta</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nome da Proposta</dt>
                    <dd className="mt-1 text-sm text-gray-900">{createdProposal.proposal_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                    <dd className="mt-1 text-sm text-gray-900">{createdProposal.client_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Valor</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(createdProposal.proposal_value)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Aberta
                      </span>
                    </dd>
                  </div>
                </div>
              </div>

              {/* Client Access Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <LockClosedIcon className="h-5 w-5 mr-2" />
                  Acesso do Cliente
                </h2>
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-blue-700">Link de Acesso</dt>
                    <dd className="mt-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={createdProposal.clientAccessUrl}
                          readOnly
                          className="flex-1 text-sm bg-white border border-blue-300 rounded px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(createdProposal.clientAccessUrl);
                            toast.success('Link copiado!');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                        >
                          Copiar
                        </button>
                      </div>
                    </dd>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-blue-700">Usuário</dt>
                      <dd className="mt-1 text-sm bg-white border border-blue-300 rounded px-3 py-2">
                        {createdProposal.client_username}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-blue-700">Senha</dt>
                      <dd className="mt-1 text-sm bg-white border border-blue-300 rounded px-3 py-2">
                        {formData.clientPassword}
                      </dd>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">
                    💡 Envie essas credenciais para o cliente acessar a proposta online
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t pt-6">
                <button
                  type="button"
                  onClick={() => setCreatedProposal(null)}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Criar Outra Proposta
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/proposals')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Ver Todas as Propostas
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/proposals/${createdProposal.id}/edit`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Editar Proposta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-7 w-7 text-blue-600 mr-3" />
              Nova Proposta
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Crie uma nova proposta para apresentar ao seu cliente
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                Informações Básicas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Proposta *
                  </label>
                  <input
                    type="text"
                    value={formData.proposalName}
                    onChange={(e) => handleInputChange('proposalName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Proposta Website Institucional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome do cliente ou empresa"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Trabalho/Projeto *
                  </label>
                  <input
                    type="text"
                    value={formData.jobName}
                    onChange={(e) => handleInputChange('jobName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descreva brevemente o trabalho"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor da Proposta (R$)
                  </label>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.proposalValue}
                      onChange={(e) => handleInputChange('proposalValue', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* URLs */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                Links das Páginas (Opcional)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Apresentação
                  </label>
                  <input
                    type="url"
                    value={formData.presentationUrl}
                    onChange={(e) => handleInputChange('presentationUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://docs.google.com/presentation/d/..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Link do Google Slides, Canva ou similar (com permissão de visualização)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Proposta Comercial
                  </label>
                  <input
                    type="url"
                    value={formData.commercialProposalUrl}
                    onChange={(e) => handleInputChange('commercialProposalUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://docs.google.com/document/d/..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Link do Google Docs, PDF online ou similar
                  </p>
                </div>
              </div>
            </div>

            {/* Scope Text */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400 mr-2" />
                  Escopo do Projeto *
                </h2>
                <button
                  type="button"
                  onClick={() => loadTemplate('scopeText')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Carregar Template
                </button>
              </div>
              <textarea
                value={formData.scopeText}
                onChange={(e) => handleInputChange('scopeText', e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Descreva detalhadamente o escopo do projeto..."
              />
              <p className="text-xs text-gray-500">
                Use Markdown para formatação (** para negrito, * para lista)
              </p>
            </div>

            {/* Terms Text */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Termos e Condições *
                </h2>
                <button
                  type="button"
                  onClick={() => loadTemplate('termsText')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Carregar Template
                </button>
              </div>
              <textarea
                value={formData.termsText}
                onChange={(e) => handleInputChange('termsText', e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Defina os termos e condições do projeto..."
              />
            </div>

            {/* Client Access */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <LockClosedIcon className="h-5 w-5 text-gray-400 mr-2" />
                Acesso do Cliente
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome de Usuário *
                  </label>
                  <input
                    type="text"
                    value={formData.clientUsername}
                    onChange={(e) => handleInputChange('clientUsername', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="username_2024"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Apenas letras, números e underscore
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.clientPassword}
                      onChange={(e) => handleInputChange('clientPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Senha do cliente"
                    />
                    <div className="absolute right-2 top-1 space-x-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title={showPassword ? 'Ocultar' : 'Mostrar'}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                        title="Gerar senha"
                      >
                        Gerar
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Mínimo 6 caracteres
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    'Criar Proposta'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}