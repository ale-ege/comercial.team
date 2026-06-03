'use client'

import { useState, useEffect } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Modal from '@/components/Modal'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Button from '@/components/Button'

interface Resultado {
  id: string
  meetingId: string
  closer: {
    id: string
    name: string
  }
  client: {
    id: string
    name: string
    company?: string
  }
  fileName?: string
  overallScore: number
  dealStatus: string
  createdAt: string
}

const MESES_OPCOES = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

const STATUS_OPCOES = [
  { value: 'Fechado', label: 'Venda', cor: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'Perdido', label: 'Perdido', cor: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'Agendar visita comercial', label: 'Agendar visita comercial', cor: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'Aguardando documentos', label: 'Aguardando documentos', cor: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'Fazer proposta', label: 'Fazer proposta', cor: 'bg-pink-100 text-pink-800 border-pink-300' },
  { value: 'Proposta enviado', label: 'Proposta enviado', cor: 'bg-sky-100 text-sky-800 border-sky-300' },
  { value: 'Negociação', label: 'Negociação', cor: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'Parceria', label: 'Parceria', cor: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { value: 'Possível parceria', label: 'Possível parceria', cor: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { value: 'Follow-up', label: 'Follow-up', cor: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'Sem interesse', label: 'Sem interesse', cor: 'bg-slate-100 text-slate-800 border-slate-300' },
  { value: 'Sem retorno', label: 'Sem retorno', cor: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'Outros', label: 'Outros', cor: 'bg-gray-100 text-gray-800 border-gray-300' },
]

function corStatus(status: string): string {
  return STATUS_OPCOES.find((s) => s.value === status)?.cor ?? 'bg-gray-100 text-gray-800 border-gray-300'
}

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingResultado, setEditingResultado] = useState<Resultado | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [closers, setClosers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [editForm, setEditForm] = useState({
    closerName: '',
    closerId: '',
    clientName: '',
    clientCompany: '',
    createdAt: '',
  })
  const [saving, setSaving] = useState(false)
  const [viewingTranscript, setViewingTranscript] = useState<{ meetingId: string; transcript: string; fileName?: string } | null>(null)
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false)
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroCloserId, setFiltroCloserId] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 11 }, (_, i) => String(currentYear - i))
  const [filtroAno, setFiltroAno] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [openFileNameId, setOpenFileNameId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadClosers()
    loadClients()
  }, [])

  useEffect(() => {
    loadResultados()
  }, [filtroEmpresa, filtroCloserId, filtroStatus, filtroAno, filtroMes])

  const loadClosers = async () => {
    try {
      const res = await fetch('/api/closers')
      const data = await res.json()
      setClosers(data.closers || [])
    } catch (err) {
      console.error('Erro ao carregar closers:', err)
    }
  }

  const loadClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data.clients || [])
    } catch (err) {
      console.error('Erro ao carregar clients:', err)
    }
  }

  const loadResultados = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtroEmpresa) params.set('company', filtroEmpresa)
      if (filtroCloserId) params.set('closerId', filtroCloserId)
      if (filtroStatus) params.set('dealStatus', filtroStatus)
      if (filtroAno) {
        params.set('year', filtroAno)
        if (filtroMes) params.set('month', filtroMes)
      }
      const res = await fetch(`/api/resultados?${params.toString()}`)
      
      if (!res.ok) {
        const errorData = await res.json()
        setError(errorData.error || 'Erro ao carregar resultados')
        return
      }
      
      const data = await res.json()
      setResultados(data.resultados || [])
    } catch (err: any) {
      console.error('Erro ao carregar resultados:', err)
      setError('Erro ao carregar resultados')
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = (reportId: string) => {
    router.push(`/relatorio/${reportId}`)
  }

  const handleViewTranscript = async (meetingId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`)
      if (!res.ok) {
        alert('Erro ao buscar transcrição')
        return
      }
      
      const meetingData = await res.json()
      if (meetingData.transcript) {
        setViewingTranscript({
          meetingId,
          transcript: meetingData.transcript,
          fileName: meetingData.fileName || undefined,
        })
        setIsTranscriptModalOpen(true)
      } else {
        alert('Transcrição não encontrada')
      }
    } catch (err: any) {
      console.error('Erro ao buscar transcrição:', err)
      alert('Erro ao buscar transcrição')
    }
  }

  const handleGenerateProposal = (resultado: Resultado) => {
    // Navegar para a página de propostas com dados pré-preenchidos
    router.push(`/propostas?meetingId=${resultado.meetingId}&clientId=${resultado.client.id}&closerId=${resultado.closer.id}`)
  }

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealStatus: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Erro ao atualizar status')
        return
      }
      setResultados((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, dealStatus: newStatus } : r))
      )
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar status')
    }
  }

  const handleDeleteReport = async (reportId: string, meetingId: string) => {
    if (!confirm('Tem certeza que deseja excluir este resultado? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json()
        alert(errorData.error || 'Erro ao excluir resultado')
        return
      }

      // Recarregar a lista
      loadResultados()
    } catch (err: any) {
      console.error('Erro ao excluir resultado:', err)
      alert('Erro ao excluir resultado')
    }
  }

  const handleEditResultado = (resultado: Resultado) => {
    const date = new Date(resultado.createdAt)
    // Formato para input datetime-local: YYYY-MM-DDTHH:mm
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}T${hours}:${minutes}`
    
    setEditingResultado(resultado)
    setEditForm({
      closerName: resultado.closer.name,
      closerId: resultado.closer.id,
      clientName: resultado.client.name,
      clientCompany: resultado.client.company || '',
      createdAt: dateStr,
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingResultado) return

    setSaving(true)
    try {
      const res = await fetch(`/api/meetings/${editingResultado.meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          closerName: editForm.closerName,
          closerId: editForm.closerId !== editingResultado.closer.id ? editForm.closerId : undefined,
          clientName: editForm.clientName,
          clientCompany: editForm.clientCompany || null,
          createdAt: editForm.createdAt,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        alert(errorData.error || 'Erro ao atualizar resultado')
        return
      }

      // Fechar modal e recarregar lista
      setIsEditModalOpen(false)
      setEditingResultado(null)
      loadResultados()
    } catch (err: any) {
      console.error('Erro ao atualizar resultado:', err)
      alert('Erro ao atualizar resultado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SidebarLayout currentModule="agente-comercial">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Resultados</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lista de todas as análises processadas
          </p>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da empresa
            </label>
            <Input
              type="text"
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              placeholder="Buscar por empresa..."
              className="w-full"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Closer
            </label>
            <Select
              value={filtroCloserId}
              onChange={(e) => setFiltroCloserId(e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                ...closers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                ...STATUS_OPCOES.map((s) => ({ value: s.value, label: s.label })),
              ]}
            />
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ano
            </label>
            <Select
              value={filtroAno}
              onChange={(e) => {
                setFiltroAno(e.target.value)
                if (!e.target.value) setFiltroMes('')
              }}
              options={[
                { value: '', label: 'Todos' },
                ...yearOptions.map((y) => ({ value: y, label: y })),
              ]}
            />
          </div>
          <div className="w-44">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mês
            </label>
            <Select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              disabled={!filtroAno}
              options={[
                { value: '', label: filtroAno ? 'Todo o ano' : 'Selecione o ano' },
                ...MESES_OPCOES.map((m) => ({ value: m.value, label: m.label })),
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">Carregando resultados...</p>
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">Nenhum resultado encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Closer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data da Call
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora da Call
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resultados.map((resultado) => {
                  const date = new Date(resultado.createdAt)
                  const dataFormatada = format(date, "dd/MM/yyyy", { locale: ptBR })
                  const horaFormatada = format(date, "HH:mm", { locale: ptBR })
                  
                  return (
                    <tr key={resultado.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {resultado.closer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dataFormatada}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {horaFormatada}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium text-gray-900">{resultado.client.name}</div>
                          {resultado.client.company && (
                            <div className="text-xs text-gray-400">{resultado.client.company}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            resultado.overallScore >= 70
                              ? 'bg-green-100 text-green-800'
                              : resultado.overallScore >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {resultado.overallScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block rounded-lg border-2 px-2 py-1 ${corStatus(resultado.dealStatus ?? 'Outros')}`}>
                          <Select
                            value={resultado.dealStatus ?? 'Outros'}
                            onChange={(e) => handleStatusChange(resultado.id, e.target.value)}
                            options={STATUS_OPCOES.map((s) => ({ value: s.value, label: s.label }))}
                            className="min-w-[160px] text-xs font-semibold border-0 bg-transparent focus:ring-0 focus:ring-offset-0 py-1"
                          />
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 relative">
                          <div className="relative">
                            <button
                              onClick={() => setOpenFileNameId(openFileNameId === resultado.id ? null : resultado.id)}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                              title="Nome do Arquivo"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                            {openFileNameId === resultado.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  aria-hidden
                                  onClick={() => setOpenFileNameId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-20 w-[280px] max-w-[90vw] max-h-[180px] overflow-auto py-2 px-3 bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
                                  <p className="font-medium text-gray-500 text-xs mb-0.5">Nome do arquivo</p>
                                  <p className="break-all text-gray-900 text-xs leading-snug">{resultado.fileName || 'N/A'}</p>
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => handleViewTranscript(resultado.meetingId)}
                            className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                            title="Ver Transcrição"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleGenerateProposal(resultado)}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                            title="Gerar Proposta"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditResultado(resultado)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleViewReport(resultado.id)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="Ver Detalhes"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteReport(resultado.id, resultado.meetingId)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                            title="Excluir"
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

      {/* Modal de Edição */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingResultado(null)
        }}
        title="Editar Resultado"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false)
                setEditingResultado(null)
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Closer
            </label>
            <Select
              value={editForm.closerId}
              onChange={(e) => {
                const selectedCloser = closers.find(c => c.id === e.target.value)
                setEditForm({
                  ...editForm,
                  closerId: e.target.value,
                  closerName: selectedCloser?.name || editForm.closerName,
                })
              }}
              options={[
                { value: '', label: 'Selecione um closer' },
                ...closers.map((c) => ({ value: c.id, label: c.name }))
              ]}
            />
            <p className="mt-1 text-xs text-gray-500">
              Ou edite o nome manualmente abaixo
            </p>
            <Input
              value={editForm.closerName}
              onChange={(e) => setEditForm({ ...editForm, closerName: e.target.value })}
              placeholder="Nome do Closer"
              className="mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Cliente
            </label>
            <Input
              value={editForm.clientName}
              onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
              placeholder="Nome do Cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Empresa
            </label>
            <Input
              value={editForm.clientCompany}
              onChange={(e) => setEditForm({ ...editForm, clientCompany: e.target.value })}
              placeholder="Nome da Empresa"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Data e Hora da Call
            </label>
            <Input
              type="datetime-local"
              value={editForm.createdAt}
              onChange={(e) => setEditForm({ ...editForm, createdAt: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Transcrição */}
      <Modal
        isOpen={isTranscriptModalOpen}
        onClose={() => {
          setIsTranscriptModalOpen(false)
          setViewingTranscript(null)
        }}
        title={`Transcrição${viewingTranscript?.fileName ? ` - ${viewingTranscript.fileName}` : ''}`}
        size="xl"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsTranscriptModalOpen(false)
                setViewingTranscript(null)
              }}
            >
              Fechar
            </Button>
          </div>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {viewingTranscript?.transcript || 'Carregando...'}
            </pre>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  )
}
