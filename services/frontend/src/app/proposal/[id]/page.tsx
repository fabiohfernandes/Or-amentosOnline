'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface ProposalData {
  id: string;
  proposal_name: string;
  client_name: string;
  job_name: string;
  presentation_url: string;
  commercial_proposal_url: string;
  scope_text: string;
  terms_text: string;
  status: string;
}

const pages = [
  { id: 1, name: 'Apresentação', description: 'Apresentação do projeto' },
  { id: 2, name: 'Proposta Comercial', description: 'Detalhes comerciais' },
  { id: 3, name: 'Escopo', description: 'Escopo do trabalho' },
  { id: 4, name: 'Termos', description: 'Termos e condições' }
];

export default function ProposalViewerPage() {
  const params = useParams();
  const proposalId = params.id as string;

  const [currentPage, setCurrentPage] = useState(1);
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.3);

  // Load proposal data
  useEffect(() => {
    const loadProposal = async () => {
      const token = localStorage.getItem('client_token');
      if (!token) {
        // Check if proposalId is a UUID (public token) or number (proposal ID)
        const isPublicToken = proposalId.includes('-') && proposalId.length > 10;
        if (isPublicToken) {
          window.location.href = `/client-login?token=${proposalId}`;
        } else {
          window.location.href = '/client-login';
        }
        return;
      }

      try {
        const response = await fetch(`/api/v1/client/proposal/${proposalId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setProposal(data.data.proposal);
        } else {
          toast.error('Erro ao carregar proposta');
          window.location.href = '/client-login';
        }
      } catch (error) {
        console.error('Error loading proposal:', error);
        toast.error('Erro ao carregar proposta');
      } finally {
        setLoading(false);
      }
    };

    if (proposalId) {
      loadProposal();
    }
  }, [proposalId]);

  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      const token = localStorage.getItem('client_token');
      if (!token || !proposal) return;

      try {
        await fetch(`/api/v1/client/proposal/${proposalId}/view`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_name: pages[currentPage - 1].name.toLowerCase(),
          }),
        });
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, [currentPage, proposal, proposalId]);

  // Save comment
  const saveComment = async () => {
    if (!comment.trim()) {
      toast.error('Por favor, digite um comentário');
      return;
    }

    const token = localStorage.getItem('client_token');
    if (!token) return;

    setSavingComment(true);

    try {
      const response = await fetch(`/api/v1/client/proposal/${proposalId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_text: comment,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Comentário salvo com sucesso!');
        setComment('');
      } else {
        toast.error(data.message || 'Erro ao salvar comentário');
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      toast.error('Erro ao salvar comentário');
    } finally {
      setSavingComment(false);
    }
  };

  // Accept proposal
  const acceptProposal = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja aceitar esta proposta? Esta ação irá fechar o negócio.'
    );

    if (!confirmed) return;

    const token = localStorage.getItem('client_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/v1/client/proposal/${proposalId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Proposta aceita com sucesso! Negócio fechado.');
        setProposal(prev => prev ? { ...prev, status: 'closed' } : null);
      } else {
        toast.error(data.message || 'Erro ao aceitar proposta');
      }
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Erro ao aceitar proposta');
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
          <p className="text-gray-600">Proposta não encontrada.</p>
          <button
            onClick={() => window.location.href = '/client-login'}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1:
        // Page 1: Presentation (iframe embed)
        return (
          <div className="iframe-container">
            {proposal.presentation_url ? (
              <iframe
                src={proposal.presentation_url}
                style={{
                  width: `${100 * zoomLevel}%`,
                  height: `${100 * zoomLevel}%`,
                  minWidth: `${100 * zoomLevel}vw`,
                  minHeight: `calc((100vh - 130px) * ${zoomLevel})`,
                  border: 'none',
                  display: 'block',
                  background: 'white',
                  transformOrigin: 'top left'
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation allow-popups allow-downloads"
                referrerPolicy="no-referrer"
                loading="eager"
                title="Apresentação do Projeto"
                frameBorder="0"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <p className="text-gray-500">Apresentação não disponível</p>
              </div>
            )}
          </div>
        );

      case 2:
        // Page 2: Commercial Proposal (iframe embed)
        return (
          <div className="iframe-container">
            {proposal.commercial_proposal_url ? (
              <iframe
                src={proposal.commercial_proposal_url}
                style={{
                  width: `${100 * zoomLevel}%`,
                  height: `${100 * zoomLevel}%`,
                  minWidth: `${100 * zoomLevel}vw`,
                  minHeight: `calc((100vh - 130px) * ${zoomLevel})`,
                  border: 'none',
                  display: 'block',
                  background: 'white',
                  transformOrigin: 'top left'
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation allow-popups allow-downloads"
                referrerPolicy="no-referrer"
                loading="eager"
                title="Proposta Comercial"
                frameBorder="0"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <p className="text-gray-500">Proposta comercial não disponível</p>
              </div>
            )}
          </div>
        );

      case 3:
        // Page 3: Scope with Comments
        return (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Escopo do Trabalho</h2>

              <div className="prose max-w-none mb-8">
                <div
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: proposal.scope_text }}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentários</h3>

                <div className="space-y-4">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deixe seu comentário sobre o escopo..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <button
                    onClick={saveComment}
                    disabled={savingComment || !comment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingComment ? 'Salvando...' : 'Salvar Comentário'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        // Page 4: Terms and Agreement
        return (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Termos e Condições</h2>

              <div className="prose max-w-none mb-8">
                <div
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: proposal.terms_text }}
                />
              </div>

              <div className="border-t pt-6">
                {proposal.status === 'closed' ? (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-800 font-semibold">Proposta Aceita - Negócio Fechado!</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">
                      Ao aceitar, você concorda com todos os termos apresentados.
                    </p>

                    <button
                      onClick={acceptProposal}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-semibold text-lg"
                    >
                      Aceitar e Fechar Negócio
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{proposal.proposal_name}</h1>
              <p className="text-sm text-gray-600">{proposal.job_name} - {proposal.client_name}</p>
            </div>

            {/* Page Indicator */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {currentPage}/4
              </span>
              <div className="flex space-x-1">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className={`h-2 w-8 rounded-full ${
                      page.id === currentPage
                        ? 'bg-blue-600'
                        : page.id < currentPage
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center space-x-4">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPage(page.id)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    page.id === currentPage
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {page.name}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              {/* Zoom controls for iframe pages */}
              {currentPage <= 2 && (
                <div className="flex items-center space-x-1 mr-4">
                  <button
                    onClick={() => {
                      const newZoom = Math.max(0.5, zoomLevel - 0.1);
                      console.log('Zoom decreasing to:', newZoom);
                      setZoomLevel(newZoom);
                    }}
                    className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200"
                    title="Diminuir zoom"
                  >
                    −
                  </button>
                  <span className="text-xs text-gray-600 px-2">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => {
                      const newZoom = Math.min(3.0, zoomLevel + 0.1);
                      console.log('Zoom increasing to:', newZoom);
                      setZoomLevel(newZoom);
                    }}
                    className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200"
                    title="Aumentar zoom"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      console.log('Resetting zoom to 1.3');
                      setZoomLevel(1.3);
                    }}
                    className="px-2 py-1 rounded text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 ml-2"
                    title="Reset zoom"
                  >
                    Reset
                  </button>
                </div>
              )}

              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>

              <button
                onClick={() => setCurrentPage(Math.min(4, currentPage + 1))}
                disabled={currentPage === 4}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className={currentPage <= 2 ? 'iframe-page-container' : 'min-h-screen'}>
        {renderCurrentPage()}
      </div>

      <style jsx>{`
        .iframe-page-container {
          position: fixed;
          top: 130px;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: calc(100vh - 130px);
          overflow: hidden;
          z-index: 1;
        }

        .iframe-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: auto;
          background: #f8f9fa;
        }

        .iframe-container::-webkit-scrollbar {
          width: 8px;
        }

        .iframe-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .iframe-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .iframe-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}