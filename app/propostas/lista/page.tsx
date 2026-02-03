'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProposalStep {
  id: string
  stepNumber: number
  approvedAt: string | null
}

interface Proposal {
  id: string
  meetingId: string
  status: string
  steps: ProposalStep[]
  updatedAt: string
  meeting: {
    id: string
    client: { 
      name: string
      company?: string | null
    }
    closer: { 
      name: string
    }
    fileName?: string | null
    createdAt: string
  }
}

export default function MinhasPropostasPage() {
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProposals()
  }, [])

  const loadProposals = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/propostas')
      if (res.ok) {
        const data = await res.json()
        setProposals(data.proposals || [])
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        setError(errorData.error || 'Erro ao carregar propostas')
      }
    } catch (err: any) {
      console.error('Erro ao carregar propostas:', err)
      setError(err.message || 'Erro ao carregar propostas')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = (meetingId: string) => {
    router.push(`/propostas?meetingId=${meetingId}`)
  }

  const handleEdit = (meetingId: string) => {
    router.push(`/propostas?meetingId=${meetingId}`)
  }

  const handleDelete = async (proposalId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita e todos os steps serão perdidos.')) {
      return
    }

    try {
      const res = await fetch(`/api/propostas/${proposalId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json()
        alert(errorData.error || 'Erro ao excluir proposta')
        return
      }

      // Recarregar a lista
      loadProposals()
    } catch (err: any) {
      console.error('Erro ao excluir proposta:', err)
      alert('Erro ao excluir proposta')
    }
  }

  return (
    <SidebarLayout currentModule="criador-proposta">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Minhas Propostas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lista de todas as propostas (concluídas e em andamento)
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">Carregando propostas...</p>
          </div>
        ) : error ? (
          <div className="px-6 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">Nenhuma proposta encontrada</p>
            <p className="text-sm text-gray-400 mt-2">
              Acesse via "Gerar Proposta" na tela de Resultados para criar uma nova proposta
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Closer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arquivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progresso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Atualização
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proposals.map((proposal) => {
                  const approvedSteps = proposal.steps.filter(s => s.approvedAt).length
                  const totalSteps = 10
                  const progress = Math.round((approvedSteps / totalSteps) * 100)
                  const lastUpdate = new Date(proposal.updatedAt)
                  
                  return (
                    <tr key={proposal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">{proposal.meeting.client.name}</div>
                        {proposal.meeting.client.company && (
                          <div className="text-xs text-gray-400">{proposal.meeting.client.company}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {proposal.meeting.closer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {proposal.meeting.fileName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            proposal.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : proposal.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {proposal.status === 'completed'
                            ? 'Concluída'
                            : proposal.status === 'in_progress'
                            ? 'Em Andamento'
                            : 'Rascunho'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${
                                progress === 100
                                  ? 'bg-green-500'
                                  : progress > 0
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-300'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {approvedSteps}/{totalSteps}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(lastUpdate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleContinue(proposal.meetingId)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="Continuar Desenvolvimento"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(proposal.meetingId)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                            title="Editar Proposta"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(proposal.id)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                            title="Excluir Proposta"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
