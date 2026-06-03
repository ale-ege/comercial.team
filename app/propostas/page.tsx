'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'
import Button from '@/components/Button'
import Textarea from '@/components/Textarea'
import Input from '@/components/Input'
import Select from '@/components/Select'
import { PROPOSAL_STEPS } from '@/lib/proposal'

interface ProposalStep {
  id: string
  stepNumber: number
  stepKey: string
  initialText: string | null
  closerNotes: string | null
  questionsJson: string | null
  closerAnswers: string | null
  finalText: string | null
  approvedAt: string | null
  approvedBy: string | null
}

interface Proposal {
  id: string
  meetingId: string
  status: string
  steps: ProposalStep[]
  updatedAt?: string | Date | null
  meeting: {
    client: { name: string; company?: string | null }
    closer: { name: string }
  }
}

export default function PropostasPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const meetingId = searchParams.get('meetingId')
  
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(1)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'create' | 'list' | 'wizard'>('create')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (meetingId) {
      setViewMode('wizard')
      loadOrCreateProposal(meetingId)
    } else {
      // Sem meetingId: carregar propostas e decidir entre criar ou listar
      loadAllProposals()
    }
  }, [meetingId])

  const loadAllProposals = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/propostas')
      if (res.ok) {
        const data = await res.json()
        setProposals(data.proposals || [])
        // Se não há propostas, mostrar formulário de criação
        if (!data.proposals || data.proposals.length === 0) {
          setViewMode('create')
        } else {
          setViewMode('list')
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        setError(errorData.error || 'Erro ao carregar propostas')
        setViewMode('create')
      }
    } catch (err: any) {
      console.error('Erro ao carregar propostas:', err)
      setError(err.message || 'Erro ao carregar propostas')
      setViewMode('create')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFromScratch = async (formData: {
    closerId: string
    clientName: string
    clientCompany: string
    proposalDescription: string
  }) => {
    try {
      setCreating(true)
      
      // Criar cliente primeiro
      const clientRes = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.clientName,
          company: formData.clientCompany || null,
        }),
      })

      if (!clientRes.ok) {
        const errorData = await clientRes.json()
        throw new Error(errorData.error || 'Erro ao criar cliente')
      }

      const clientData = await clientRes.json()
      const clientId = clientData.client.id

      // Criar meeting com a descrição da proposta como transcrição inicial
      const meetingRes = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          closerId: formData.closerId,
          transcript: formData.proposalDescription,
          fileName: `Proposta - ${formData.clientCompany || formData.clientName}`,
        }),
      })

      if (!meetingRes.ok) {
        const errorData = await meetingRes.json()
        throw new Error(errorData.error || 'Erro ao criar reunião')
      }

      const meetingData = await meetingRes.json()
      const newMeetingId = meetingData.meeting.id

      // Criar proposta
      const proposalRes = await fetch('/api/propostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: newMeetingId }),
      })

      if (!proposalRes.ok) {
        const errorData = await proposalRes.json()
        throw new Error(errorData.error || 'Erro ao criar proposta')
      }

      // Redirecionar para o wizard
      router.push(`/propostas?meetingId=${newMeetingId}`)
    } catch (err: any) {
      console.error('Erro ao criar proposta:', err)
      alert(err.message || 'Erro ao criar proposta')
    } finally {
      setCreating(false)
    }
  }

  const loadOrCreateProposal = async (meetingId: string) => {
    try {
      setLoading(true)
      // Tentar buscar primeiro
      const res = await fetch(`/api/propostas?meetingId=${meetingId}`)
      if (res.ok) {
        const data = await res.json()
        setProposal(data.proposal)
        // Determinar primeiro step não aprovado
        const firstUnapproved = data.proposal.steps.find((s: ProposalStep) => !s.approvedAt)
        if (firstUnapproved) {
          setActiveStep(firstUnapproved.stepNumber)
        } else if (data.proposal.steps.length > 0) {
          setActiveStep(Math.min(data.proposal.steps.length + 1, 10))
        }
      } else {
        // Criar nova proposta
        const createRes = await fetch('/api/propostas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId }),
        })
        if (createRes.ok) {
          const data = await createRes.json()
          setProposal(data.proposal)
        } else {
          const errorData = await createRes.json().catch(() => ({ error: 'Erro desconhecido', details: 'Não foi possível ler a resposta do servidor' }))
          throw new Error(errorData.error || errorData.details || 'Erro ao criar proposta')
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar proposta:', err)
      const errorMessage = err.message || 'Erro ao carregar proposta'
      setError(errorMessage)
      // Log detalhado para debug
      console.error('Detalhes do erro:', {
        message: err.message,
        stack: err.stack,
        meetingId,
      })
    } finally {
      setLoading(false)
    }
  }

  const reloadProposal = async () => {
    if (!proposal) return
    const res = await fetch(`/api/propostas/${proposal.id}`)
    if (res.ok) {
      const data = await res.json()
      setProposal(data.proposal)
    }
  }

  if (loading) {
    return (
      <SidebarLayout currentModule="criador-proposta">
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </SidebarLayout>
    )
  }

  // Modo criar: formulário para criar proposta do zero
  if (viewMode === 'create') {
    return (
      <SidebarLayout currentModule="criador-proposta">
        <CreateProposalForm 
          onCreate={handleCreateFromScratch} 
          creating={creating}
          onCancel={() => {
            if (proposals.length > 0) {
              setViewMode('list')
            }
          }}
        />
      </SidebarLayout>
    )
  }

  // Modo lista: mostrar todas as propostas
  if (viewMode === 'list') {
    return (
      <SidebarLayout currentModule="criador-proposta">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Criador de Proposta</h1>
              <p className="mt-1 text-sm text-gray-500">
                Lista de todas as propostas (concluídas e em andamento)
              </p>
            </div>
            <Button onClick={() => setViewMode('create')}>
              Criar Nova Proposta
            </Button>
          </div>

          {error ? (
            <div className="px-6 py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          ) : proposals.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">Nenhuma proposta encontrada</p>
              <p className="text-sm text-gray-400 mt-2">
                Clique em "Criar Nova Proposta" para começar
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
                  {proposals.map((prop) => {
                    const approvedSteps = prop.steps.filter(s => s.approvedAt).length
                    const totalSteps = 10
                    const progress = Math.round((approvedSteps / totalSteps) * 100)
                    
                    return (
                      <tr key={prop.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="font-medium text-gray-900">{prop.meeting.client.name}</div>
                          {prop.meeting.client.company && (
                            <div className="text-xs text-gray-400">{prop.meeting.client.company}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {prop.meeting.closer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              prop.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : prop.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {prop.status === 'completed'
                              ? 'Concluída'
                              : prop.status === 'in_progress'
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
                            <span className="text-xs text-gray-600">
                              {approvedSteps}/{totalSteps}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {prop.updatedAt
                            ? new Date(prop.updatedAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/propostas?meetingId=${prop.meetingId}`)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="Abrir Proposta"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
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

  // Modo wizard: mostrar proposta específica
  if (error || !proposal) {
    return (
      <SidebarLayout currentModule="criador-proposta">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Criador de Proposta</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar proposta</h2>
            <p className="text-red-800 mb-2">{error || 'Proposta não encontrada'}</p>
            {error?.includes('banco de dados') || error?.includes('db push') ? (
              <div className="mt-4 p-3 bg-white rounded border border-red-300">
                <p className="text-sm text-gray-700 font-medium mb-2">Para resolver:</p>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li>Execute: <code className="bg-gray-100 px-2 py-1 rounded">npx prisma db push</code></li>
                  <li>Execute: <code className="bg-gray-100 px-2 py-1 rounded">npx prisma generate</code></li>
                  <li>Reinicie o servidor de desenvolvimento</li>
                </ol>
              </div>
            ) : (
              <div className="mt-4">
                <button
                  onClick={() => {
                    if (proposals.length > 0) {
                      setViewMode('list')
                    } else {
                      setViewMode('create')
                    }
                  }}
                  className="text-blue-600 hover:text-blue-900 underline"
                >
                  Voltar
                </button>
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    )
  }

  // Modo wizard: mostrar proposta específica (só chega aqui se viewMode === 'wizard' e proposal existe)
  return (
    <SidebarLayout currentModule="criador-proposta">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Criador de Proposta</h1>
            <p className="mt-1 text-sm text-gray-500">
              Cliente: {proposal.meeting.client.name}
              {proposal.meeting.client.company && ` - ${proposal.meeting.client.company}`}
              {' | '}
              Closer: {proposal.meeting.closer.name}
            </p>
          </div>
          <button
            onClick={() => router.push('/propostas/lista')}
            className="text-sm text-blue-600 hover:text-blue-900 font-medium"
          >
            ← Voltar para lista
          </button>
        </div>

        <div className="flex">
          {/* Sidebar com steps */}
          <div className="w-64 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {PROPOSAL_STEPS.map((step) => {
                const stepData = proposal.steps.find(s => s.stepNumber === step.number)
                const isApproved = stepData?.approvedAt !== null
                const isActive = activeStep === step.number
                const isEnabled = step.number === 1 || 
                  (step.number > 1 && proposal.steps.find(s => s.stepNumber === step.number - 1)?.approvedAt !== null)

                return (
                  <button
                    key={step.number}
                    onClick={() => isEnabled && setActiveStep(step.number)}
                    disabled={!isEnabled}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : isEnabled
                        ? 'text-gray-700 hover:bg-gray-50'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full ${
                        isApproved
                          ? 'bg-green-500'
                          : stepData
                          ? 'bg-yellow-500'
                          : 'bg-gray-200'
                      }`} />
                      <span>{step.title}</span>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Conteúdo do step ativo */}
          <div className="flex-1 p-6">
            <ProposalStepContent
              proposalId={proposal.id}
              stepNumber={activeStep}
              stepData={proposal.steps.find(s => s.stepNumber === activeStep)}
              onUpdate={reloadProposal}
            />
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}

function ProposalStepContent({
  proposalId,
  stepNumber,
  stepData,
  onUpdate,
}: {
  proposalId: string
  stepNumber: number
  stepData?: ProposalStep
  onUpdate: () => void
}) {
  const step = PROPOSAL_STEPS.find(s => s.number === stepNumber)
  const [loading, setLoading] = useState(false)
  const [closerNotes, setCloserNotes] = useState(stepData?.closerNotes || '')
  const [closerAnswers, setCloserAnswers] = useState(stepData?.closerAnswers || '')
  const [questions, setQuestions] = useState<any[]>([])
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({})

  useEffect(() => {
    if (stepData?.questionsJson) {
      try {
        const parsed = JSON.parse(stepData.questionsJson)
        console.log('Parsed questions:', parsed)
        // Tentar diferentes formatos possíveis
        let questionsArray = []
        if (Array.isArray(parsed)) {
          questionsArray = parsed
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
          questionsArray = parsed.questions
        } else if (parsed.perguntas && Array.isArray(parsed.perguntas)) {
          questionsArray = parsed.perguntas
        } else if (typeof parsed === 'object') {
          // Tentar extrair perguntas de um objeto
          questionsArray = Object.values(parsed).filter((item: any) => 
            item && (item.pergunta || item.pergunta_texto || item.text || typeof item === 'string')
          )
        }
        console.log('Questions array:', questionsArray)
        setQuestions(questionsArray)
      } catch (e) {
        console.error('Erro ao parsear questions:', e)
        console.error('Raw questionsJson:', stepData.questionsJson)
        setQuestions([])
      }
    } else {
      setQuestions([])
    }
    setCloserNotes(stepData?.closerNotes || '')
    setCloserAnswers(stepData?.closerAnswers || '')
    
    // Carregar respostas individuais das perguntas
    if (stepNumber === 2 && stepData?.closerAnswers) {
      try {
        const parsed = JSON.parse(stepData.closerAnswers)
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          setQuestionAnswers(parsed)
        } else {
          // Se for string simples, manter compatibilidade
          setQuestionAnswers({})
        }
      } catch (e) {
        // Se não for JSON, manter como estava (compatibilidade)
        setQuestionAnswers({})
      }
    } else {
      setQuestionAnswers({})
    }
  }, [stepData, stepNumber])

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/propostas/${proposalId}/steps/${stepNumber}/generate`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao gerar')
      }
      await onUpdate()
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar conteúdo')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAnswers = async () => {
    if (stepNumber !== 2) return
    
    try {
      // Converter respostas individuais para JSON
      const answersJson = JSON.stringify(questionAnswers)
      await fetch(`/api/propostas/${proposalId}/steps/${stepNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closerAnswers: answersJson,
        }),
      })
    } catch (err: any) {
      console.error('Erro ao salvar respostas:', err)
    }
  }

  const handleReprocess = async () => {
    setLoading(true)
    try {
      // Salvar notas primeiro
      const answersToSave = stepNumber === 2 
        ? JSON.stringify(questionAnswers) 
        : undefined
        
      await fetch(`/api/propostas/${proposalId}/steps/${stepNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closerNotes,
          closerAnswers: answersToSave,
        }),
      })

      const res = await fetch(`/api/propostas/${proposalId}/steps/${stepNumber}/reprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closerNotes,
          closerAnswers: answersToSave,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao reprocessar')
      }
      await onUpdate()
    } catch (err: any) {
      alert(err.message || 'Erro ao reprocessar')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (useInitial = false) => {
    if (useInitial) {
      // Aprovar usando versão inicial (ou perguntas para Step 2)
      if (stepNumber === 2) {
        if (!stepData?.questionsJson) {
          alert('Gere as perguntas primeiro')
          return
        }
        if (!confirm('Tem certeza que deseja aprovar apenas as perguntas sem gerar a versão ampliada? Isso liberará o próximo step.')) {
          return
        }
      } else {
        if (!stepData?.initialText) {
          alert('Gere o conteúdo inicial primeiro')
          return
        }
        if (!confirm('Tem certeza que deseja aprovar a versão inicial sem reprocessar? Isso liberará o próximo step.')) {
          return
        }
      }
    } else {
      // Aprovar usando versão final
      if (!stepData?.finalText) {
        alert('Gere a versão final primeiro ou use o botão "Aprovar Versão Inicial"')
        return
      }
      if (!confirm('Tem certeza que deseja aprovar este step? Isso liberará o próximo step.')) {
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/propostas/${proposalId}/steps/${stepNumber}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao aprovar')
      }
      await onUpdate()
      alert('Step aprovado com sucesso!')
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{step?.title}</h2>
        <p className="text-sm text-gray-600">Step {stepNumber} de 10</p>
      </div>

      {/* Step 2: Perguntas */}
      {stepNumber === 2 && (
        <>
          {questions.length > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Perguntas da IA</h3>
              <div className="space-y-4">
                {questions.map((q: any, idx: number) => (
                  <div key={idx} className="bg-white rounded p-3">
                    <p className="font-medium text-gray-900 mb-2">
                      {q.pergunta || q.pergunta_texto || q.text || q.question || (typeof q === 'string' ? q : JSON.stringify(q))}
                    </p>
                    {(q.por_que_importa || q.why_important || q.importancia) && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Por que é importante:</strong> {q.por_que_importa || q.why_important || q.importancia}
                      </p>
                    )}
                    {(q.exemplo_resposta || q.example_answer || q.exemplo) && (
                      <p className="text-sm text-gray-500 italic mb-3">
                        <strong>Exemplo:</strong> {q.exemplo_resposta || q.example_answer || q.exemplo}
                      </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Textarea
                        label="Sua Resposta"
                        rows={3}
                        value={questionAnswers[idx] || ''}
                        onChange={(e) => {
                          setQuestionAnswers({
                            ...questionAnswers,
                            [idx]: e.target.value,
                          })
                        }}
                        onBlur={handleSaveAnswers}
                        placeholder="Digite sua resposta aqui..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : stepData?.questionsJson ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ Perguntas encontradas mas não foram parseadas corretamente. Verifique o console para mais detalhes.
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-yellow-700">Ver JSON bruto</summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40">
                  {stepData.questionsJson}
                </pre>
              </details>
            </div>
          ) : null}
        </>
      )}

      {/* Botão Gerar (se não tem initialText) */}
      {!stepData?.initialText && stepNumber !== 2 && (
        <div>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Gerando...' : 'Gerar Versão Inicial'}
          </Button>
        </div>
      )}

      {/* Step 2: Gerar perguntas primeiro */}
      {stepNumber === 2 && !stepData?.questionsJson && (
        <div>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Gerando perguntas...' : 'Gerar Perguntas'}
          </Button>
        </div>
      )}

      {/* Versão Inicial */}
      {stepData?.initialText && stepNumber !== 2 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Versão Inicial</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
              {stepData.initialText}
            </div>
          </div>
        </div>
      )}

      {/* Considerações do Closer (apenas para steps que não são Step 2) */}
      {stepNumber !== 2 && (
        <div>
          <Textarea
            label="Considerações do Closer / Ajustes"
            rows={4}
            value={closerNotes}
            onChange={(e) => setCloserNotes(e.target.value)}
          />
        </div>
      )}

      {/* Botão Reprocessar */}
      {stepData?.initialText && (
        <div>
          <Button variant="secondary" onClick={handleReprocess} disabled={loading}>
            {loading ? 'Reprocessando...' : stepNumber === 2 ? 'Gerar Versão Ampliada (8 parágrafos)' : 'Reprocessar'}
          </Button>
        </div>
      )}

      {/* Versão Final */}
      {stepData?.finalText && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Versão Final</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
              {stepData.finalText}
            </div>
          </div>
        </div>
      )}

      {/* Botões de Aprovação */}
      {!stepData?.approvedAt && (
        <div className="flex gap-3">
          {/* Botão Aprovar Versão Final */}
          {stepData?.finalText && (
            <Button onClick={() => handleApprove(false)} disabled={loading}>
              {loading ? 'Aprovando...' : 'OK / Aprovar Versão Final'}
            </Button>
          )}
          
          {/* Botão Aprovar Versão Inicial (quando não há versão final) */}
          {/* Para Step 2: mostrar se há perguntas mas não há versão ampliada */}
          {/* Para outros steps: mostrar se há initialText mas não há finalText */}
          {((stepNumber === 2 && stepData?.questionsJson && !stepData?.finalText) ||
            (stepNumber !== 2 && stepData?.initialText && !stepData?.finalText)) && (
            <Button onClick={() => handleApprove(true)} disabled={loading} variant="secondary">
              {loading ? 'Aprovando...' : stepNumber === 2 ? 'OK / Aprovar (sem versão ampliada)' : 'OK / Aprovar Versão Inicial'}
            </Button>
          )}
        </div>
      )}

      {/* Status de Aprovado */}
      {stepData?.approvedAt && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            ✓ Este step foi aprovado em {new Date(stepData.approvedAt).toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  )
}

function CreateProposalForm({
  onCreate,
  creating,
  onCancel,
}: {
  onCreate: (data: {
    closerId: string
    clientName: string
    clientCompany: string
    proposalDescription: string
  }) => Promise<void>
  creating: boolean
  onCancel: () => void
}) {
  const [closers, setClosers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    closerId: '',
    clientName: '',
    clientCompany: '',
    proposalDescription: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClosers()
  }, [])

  const loadClosers = async () => {
    try {
      const res = await fetch('/api/closers')
      const data = await res.json()
      setClosers(data.closers || [])
    } catch (err) {
      console.error('Erro ao carregar closers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.closerId || !formData.clientName || !formData.proposalDescription.trim()) {
      alert('Preencha todos os campos obrigatórios')
      return
    }
    await onCreate(formData)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Criar Nova Proposta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Preencha os dados abaixo para criar uma proposta do zero
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-3xl">
        <Select
          label="Closer *"
          value={formData.closerId}
          onChange={(e) => setFormData({ ...formData, closerId: e.target.value })}
          options={[
            { value: '', label: 'Selecione um closer' },
            ...closers.map((c) => ({ value: c.id, label: c.name })),
          ]}
          required
        />

        <Input
          label="Nome do Cliente / Empresa *"
          value={formData.clientName}
          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          placeholder="Ex: João Silva"
          required
        />

        <Input
          label="Nome da Empresa"
          value={formData.clientCompany}
          onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
          placeholder="Ex: Empresa XYZ Ltda"
        />

        <Textarea
          label="Descrição da Proposta *"
          rows={10}
          value={formData.proposalDescription}
          onChange={(e) => setFormData({ ...formData, proposalDescription: e.target.value })}
          placeholder="Descreva o projeto, necessidades do cliente, contexto, desafios, objetivos, etc. Esta descrição será usada como base para gerar a proposta completa."
          required
        />

        <p className="text-sm text-gray-600">
          <strong>Dica:</strong> Quanto mais detalhada for a descrição, melhor será a qualidade da proposta gerada. 
          Inclua informações sobre o contexto do cliente, desafios enfrentados, objetivos do projeto e qualquer outra informação relevante.
        </p>

        <div className="flex gap-3">
          <Button type="submit" disabled={creating || loading}>
            {creating ? 'Criando...' : 'Criar Proposta e Iniciar Wizard'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={creating}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
