// ============================================================================
// New Proposal Creation Page - Professional Proposal Builder
// NOVA Agent - Frontend Development Specialist
// MAESTRO Orchestrated - User Interface Enhancement Phase
// ============================================================================

'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  CloudArrowUpIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

// Form data structure
interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ProposalForm {
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientPhone: string;
  description: string;
  validUntil: string;
  paymentTerms: string;
  deliveryTime: string;
  items: ProposalItem[];
  notes: string;
  attachments: File[];
}

const initialFormState: ProposalForm = {
  title: '',
  clientName: '',
  clientEmail: '',
  clientCompany: '',
  clientPhone: '',
  description: '',
  validUntil: '',
  paymentTerms: '30',
  deliveryTime: '',
  items: [
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ],
  notes: '',
  attachments: [],
};

export default function NewProposalPage() {
  const [formData, setFormData] = useState<ProposalForm>(initialFormState);
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const updateFormData = (field: keyof ProposalForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: ProposalItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (id: string, field: keyof ProposalItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      }),
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };

  const getTotalValue = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);

    // In a real app, this would submit to the API
    console.log('Submitting proposal:', { ...formData, isDraft });
  };

  const steps = [
    { id: 1, name: 'Informações Básicas', icon: UserIcon },
    { id: 2, name: 'Itens e Valores', icon: CurrencyDollarIcon },
    { id: 3, name: 'Revisão e Envio', icon: EyeIcon },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/proposals"
                className="btn-ghost p-2"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nova Proposta</h1>
                <p className="text-sm text-secondary-600">
                  Crie uma proposta comercial profissional
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSubmit(true)}
                className="btn-secondary"
                disabled={isLoading}
              >
                Salvar Rascunho
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar Proposta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Steps Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    activeStep >= step.id
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-secondary-300 bg-white text-secondary-500'
                  }`}
                >
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    activeStep >= step.id ? 'text-primary-600' : 'text-secondary-500'
                  }`}>
                    {step.name}
                  </p>
                </div>
                {stepIdx < steps.length - 1 && (
                  <div className={`flex-1 mx-6 h-px ${
                    activeStep > step.id ? 'bg-primary-600' : 'bg-secondary-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {activeStep === 1 && (
          <div className="card p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Informações da Proposta
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Título da Proposta *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    placeholder="Ex: Website E-commerce Completo"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Descrição do Projeto
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={4}
                    placeholder="Descreva brevemente o escopo do projeto..."
                    className="input-field resize-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informações do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => updateFormData('clientName', e.target.value)}
                    placeholder="Nome completo"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => updateFormData('clientEmail', e.target.value)}
                    placeholder="cliente@email.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.clientCompany}
                    onChange={(e) => updateFormData('clientCompany', e.target.value)}
                    placeholder="Nome da empresa"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => updateFormData('clientPhone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Condições da Proposta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Válida até *
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => updateFormData('validUntil', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Prazo de Pagamento
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => updateFormData('paymentTerms', e.target.value)}
                    className="input-field"
                  >
                    <option value="7">7 dias</option>
                    <option value="15">15 dias</option>
                    <option value="30">30 dias</option>
                    <option value="45">45 dias</option>
                    <option value="60">60 dias</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Prazo de Entrega
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryTime}
                    onChange={(e) => updateFormData('deliveryTime', e.target.value)}
                    placeholder="Ex: 30 dias úteis"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveStep(2)}
                className="btn-primary"
                disabled={!formData.title || !formData.clientName || !formData.clientEmail}
              >
                Próximo: Itens e Valores
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Items and Values */}
        {activeStep === 2 && (
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Itens da Proposta
              </h2>
              <button onClick={addItem} className="btn-primary flex items-center">
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-medium text-secondary-700">
                      Item {index + 1}
                    </h4>
                    {formData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-danger-600 hover:text-danger-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Descrição *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Descrição do serviço/produto"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Valor Unitário
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Total
                      </label>
                      <div className="input-field bg-secondary-50 text-secondary-700 font-medium">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="mt-8 p-6 bg-primary-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-primary-700">Valor Total da Proposta</p>
                  <p className="text-2xl font-bold text-primary-900">
                    {formatCurrency(getTotalValue())}
                  </p>
                </div>
                <div className="text-right text-sm text-primary-700">
                  <p>{formData.items.length} {formData.items.length === 1 ? 'item' : 'itens'}</p>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Observações Adicionais
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                rows={3}
                placeholder="Informações complementares, condições especiais, etc..."
                className="input-field resize-none"
              />
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setActiveStep(1)}
                className="btn-outline"
              >
                Voltar
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="btn-primary"
                disabled={formData.items.some(item => !item.description || item.unitPrice <= 0)}
              >
                Próximo: Revisão
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Send */}
        {activeStep === 3 && (
          <div className="space-y-6">
            {/* Preview Card */}
            <div className="card p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Revisão da Proposta
              </h2>

              {/* Proposal Preview */}
              <div className="bg-white border-2 border-dashed border-secondary-300 rounded-lg p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-primary-600 mb-2">
                    PROPOSTA COMERCIAL
                  </h1>
                  <p className="text-secondary-600">#{Date.now()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Dados do Cliente:</h3>
                    <div className="space-y-1 text-sm text-secondary-700">
                      <p><strong>Nome:</strong> {formData.clientName}</p>
                      <p><strong>Email:</strong> {formData.clientEmail}</p>
                      {formData.clientCompany && <p><strong>Empresa:</strong> {formData.clientCompany}</p>}
                      {formData.clientPhone && <p><strong>Telefone:</strong> {formData.clientPhone}</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Detalhes da Proposta:</h3>
                    <div className="space-y-1 text-sm text-secondary-700">
                      <p><strong>Projeto:</strong> {formData.title}</p>
                      <p><strong>Válida até:</strong> {new Date(formData.validUntil).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Prazo de Pagamento:</strong> {formData.paymentTerms} dias</p>
                      <p><strong>Prazo de Entrega:</strong> {formData.deliveryTime}</p>
                    </div>
                  </div>
                </div>

                {formData.description && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-900 mb-3">Descrição do Projeto:</h3>
                    <p className="text-secondary-700 text-sm leading-relaxed">{formData.description}</p>
                  </div>
                )}

                {/* Items Table */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Itens:</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-secondary-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">
                            Descrição
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-secondary-500 uppercase">
                            Qtd
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">
                            Valor Unit.
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-200">
                        {formData.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-secondary-900">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-secondary-700">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-secondary-700">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-secondary-900">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary-50">
                          <td colSpan={3} className="px-4 py-4 text-sm font-medium text-primary-900">
                            VALOR TOTAL
                          </td>
                          <td className="px-4 py-4 text-lg font-bold text-right text-primary-900">
                            {formatCurrency(getTotalValue())}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {formData.notes && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Observações:</h3>
                    <p className="text-secondary-700 text-sm leading-relaxed">{formData.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <button
                  onClick={() => setActiveStep(2)}
                  className="btn-outline w-full sm:w-auto"
                >
                  Voltar para Edição
                </button>

                <div className="flex space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleSubmit(true)}
                    className="btn-secondary flex-1 sm:flex-none"
                    disabled={isLoading}
                  >
                    Salvar Rascunho
                  </button>
                  <button
                    onClick={() => handleSubmit(false)}
                    className="btn-primary flex-1 sm:flex-none"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Enviando...' : 'Enviar Proposta'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}