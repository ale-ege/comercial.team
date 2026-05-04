'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import SidebarLayout from '@/components/SidebarLayout'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Modal from '@/components/Modal'
import {
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts'

export default function RelatorioPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loadingAnswer, setLoadingAnswer] = useState(false)
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [askModalOpen, setAskModalOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/reports/${params.id}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.error || 'Relatório não encontrado')
          })
        }
        return res.json()
      })
      .then((data) => {
        setReport(data)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        console.error('Erro ao carregar relatório:', err)
        setError(err.message || 'Erro ao carregar relatório')
        setLoading(false)
      })
  }, [params.id])

  const handleExportJSON = () => {
    if (!report) return
    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-${params.id}.json`
    link.click()
  }

  const handleExportPDF = async () => {
    // Implementação básica usando window.print
    window.print()
  }

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      alert('Por favor, digite uma pergunta')
      return
    }

    setLoadingAnswer(true)
    setAnswerError(null)
    setAnswer(null)

    try {
      const res = await fetch(`/api/reports/${params.id}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao processar pergunta')
      }

      const data = await res.json()
      setAnswer(data.answer)
    } catch (err: any) {
      console.error('Erro ao fazer pergunta:', err)
      setAnswerError(err.message || 'Erro ao processar pergunta')
    } finally {
      setLoadingAnswer(false)
    }
  }

  if (loading) {
    return (
      <SidebarLayout currentModule="agente-comercial">
        <div className="text-center py-12">Carregando...</div>
      </SidebarLayout>
    )
  }

  if (error || !report) {
    return (
      <SidebarLayout currentModule="agente-comercial">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Relatório não encontrado'}</p>
          <Button onClick={() => router.push('/resultados')}>
            Voltar para Resultados
          </Button>
        </div>
      </SidebarLayout>
    )
  }

  const criteria = report.criteria || []
  const chartData = report.chart_data || {}

  return (
    <SidebarLayout currentModule="agente-comercial">
      <div className="print-report print:bg-white">
        <div className="mb-6 flex justify-between items-center flex-wrap gap-2 print:mb-3">
          <h1 className="text-3xl font-bold text-gray-900 print:text-lg">Relatório de Análise</h1>
          <div className="flex gap-2 no-print print:hidden">
            <Button variant="secondary" onClick={handleExportJSON}>
              Exportar JSON
            </Button>
            <Button variant="secondary" onClick={handleExportPDF}>
              Exportar PDF
            </Button>
            <Button onClick={() => router.push('/')}>Nova Análise</Button>
          </div>
        </div>

        {/* Informações da Reunião */}
        {report.meeting && (
          <div className="bg-white shadow rounded-lg p-6 mb-6 print-card print-keep-together print:p-3 print:mb-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1 print:text-xs">Closer</div>
                <div className="text-lg font-semibold text-gray-900 print:text-sm">
                  {report.meeting.closer?.name || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1 print:text-xs">Cliente / Empresa</div>
                <div className="text-lg font-semibold text-gray-900 print:text-sm">
                  {report.meeting.client?.name || report.meeting.client?.company || 'N/A'}
                  {report.meeting.client?.company && report.meeting.client?.name && (
                    <span className="text-gray-600 print:text-xs"> ({report.meeting.client.company})</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1 print:text-xs">Data da Reunião</div>
                <div className="text-lg font-semibold text-gray-900 print:text-sm">
                  {report.meeting.createdAt
                    ? format(new Date(report.meeting.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumo Executivo - Primeira Página: Quadro único Nota + Informações + Resumo + Gráficos */}
        <div className="print-first-page-content">
          {/* Quadro único: Nota Geral em destaque + Informações Adicionais compactas */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6 print-card print-keep-together print:mb-3">
            {/* Destaque: Nota Geral - estilo inline garante fundo azul mesmo se CSS carregar depois */}
            <div
              className="px-6 py-4 print:py-2"
              style={{
                background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                color: '#ffffff',
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-sm font-medium print:text-xs" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Nota Geral
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold print:text-2xl print:font-bold" style={{ color: '#ffffff' }}>
                    {report.overallScore.toFixed(1)}
                  </span>
                  <span className="text-sm print:text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    de 100 pontos
                  </span>
                </div>
              </div>
            </div>

            {/* Informações Adicionais compactas */}
            <div className="p-4 print:p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2 print:text-xs">
                {report.metadata?.next_steps_clarity !== undefined && (
                  <div className="border border-gray-100 rounded-lg px-3 py-2 print:py-1">
                    <div className="text-gray-500 text-xs print:text-[10px]">Clareza dos Próximos Passos</div>
                    <div className="font-semibold text-gray-900 print:text-xs">{report.metadata.next_steps_clarity}/10</div>
                  </div>
                )}
                {report.metadata?.objections_quality !== undefined && (
                  <div className="border border-gray-100 rounded-lg px-3 py-2 print:py-1">
                    <div className="text-gray-500 text-xs print:text-[10px]">Qualidade Objeções</div>
                    <div className="font-semibold text-gray-900 print:text-xs">{report.metadata.objections_quality}/10</div>
                  </div>
                )}
                {report.metadata?.talk_ratio_estimate !== undefined && (
                  <div className="border border-gray-100 rounded-lg px-3 py-2 print:py-1">
                    <div className="text-gray-500 text-xs print:text-[10px]">Proporção de Fala (Closer)</div>
                    <div className="font-semibold text-gray-900 print:text-xs">{(report.metadata.talk_ratio_estimate * 100).toFixed(0)}%</div>
                  </div>
                )}
                {report.metadata?.client_engagement !== undefined && (
                  <div className="border border-gray-100 rounded-lg px-3 py-2 print:py-1">
                    <div className="text-gray-500 text-xs print:text-[10px]">Engajamento do Cliente</div>
                    <div className="font-semibold text-gray-900 print:text-xs">{report.metadata.client_engagement}/10</div>
                  </div>
                )}
              </div>

              {report.metadata?.risks && report.metadata.risks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 print:mt-2 print:pt-2">
                  <h4 className="text-xs font-semibold text-red-700 mb-1.5 print:mb-1 print:text-[10px]">Riscos Identificados</h4>
                  <ul className="list-disc list-inside text-xs text-gray-700 space-y-0.5 print:text-[10px]">
                    {report.metadata.risks.map((risk: string, i: number) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-white shadow rounded-lg p-6 mb-6 print-card print-keep-together print:p-1 print:mb-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-xs print:mb-0.5">Resumo</h2>
                <p className="text-gray-700 print:text-xs leading-tight">{report.insights?.summary}</p>
              </div>
              {/* Ícone para abrir pergunta sobre a reunião */}
              <button
                type="button"
                onClick={() => setAskModalOpen(true)}
                className="flex-shrink-0 no-print print:hidden flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Faça uma pergunta sobre a reunião"
                aria-label="Faça uma pergunta sobre a reunião"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal: Faça uma Pergunta sobre a Reunião */}
          <Modal
            isOpen={askModalOpen}
            onClose={() => setAskModalOpen(false)}
            title="Faça uma Pergunta sobre a Reunião"
            size="md"
          >
            <p className="text-sm text-gray-600 mb-4">
              Digite uma pergunta e nossa IA analisará a transcrição completa para fornecer uma resposta detalhada.
            </p>
            <div className="space-y-4">
              <Input
                label="Sua Pergunta"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Quais foram os principais pontos de objeção levantados pelo cliente?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAskQuestion()
                  }
                }}
              />

              <Button 
                onClick={handleAskQuestion} 
                disabled={loadingAnswer || !question.trim()}
              >
                {loadingAnswer ? 'Processando...' : 'Enviar Pergunta'}
              </Button>

              {answerError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{answerError}</p>
                </div>
              )}

              {answer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Resposta:</h3>
                  <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                    {answer}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <button
                      type="button"
                      onClick={() => {
                        setAnswer(null)
                        setQuestion('')
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Fazer Nova Pergunta
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Dica: Pressione Ctrl+Enter para enviar a pergunta rapidamente
            </p>
          </Modal>

          {/* Compromissos da Reunião - logo após o Resumo */}
          {report.insights?.commitments &&
            (report.insights.commitments.closer_actions?.length > 0 ||
              report.insights.commitments.lead_actions?.length > 0) && (
              <div className="bg-white shadow rounded-lg p-6 mb-6 print-card print-keep-together print:p-3 print:mb-3">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-base print:mb-2">
                  Compromissos da Reunião
                </h2>
                <p className="text-sm text-gray-600 mb-4 print:text-xs">
                  Ações acordadas durante a reunião que devem ser executadas
                </p>

                {report.insights.commitments.closer_actions &&
                  report.insights.commitments.closer_actions.length > 0 && (
                    <div className="mb-6 print:mb-4">
                      <h3 className="text-lg font-semibold text-blue-700 mb-3 print:text-sm print:mb-2">
                        Ações do Closer
                      </h3>
                      <div className="space-y-3 print:space-y-2">
                        {report.insights.commitments.closer_actions.map(
                          (commitment: any, index: number) => (
                            <div
                              key={index}
                              className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r print:py-1"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 print:text-xs">
                                    {commitment.action}
                                  </p>
                                  {commitment.due_when && (
                                    <p className="text-xs text-gray-600 mt-1 print:text-xs">
                                      Prazo: {commitment.due_when}
                                    </p>
                                  )}
                                  {commitment.evidence_quote && (
                                    <p className="text-xs text-gray-500 italic mt-2 print:text-xs">
                                      "{commitment.evidence_quote}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {report.insights.commitments.lead_actions &&
                  report.insights.commitments.lead_actions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-3 print:text-sm print:mb-2">
                        Ações do Cliente
                      </h3>
                      <div className="space-y-3 print:space-y-2">
                        {report.insights.commitments.lead_actions.map(
                          (commitment: any, index: number) => (
                            <div
                              key={index}
                              className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r print:py-1"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 print:text-xs">
                                    {commitment.action}
                                  </p>
                                  {commitment.due_when && (
                                    <p className="text-xs text-gray-600 mt-1 print:text-xs">
                                      Prazo: {commitment.due_when}
                                    </p>
                                  )}
                                  {commitment.evidence_quote && (
                                    <p className="text-xs text-gray-500 italic mt-2 print:text-xs">
                                      "{commitment.evidence_quote}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

          {/* Gráficos */}
          <div className="print-charts-group">
          {chartData.radar && (
            <div className="print-chart-radar bg-white shadow rounded-lg p-6 mb-6 print-card print-keep-together print:p-1 print:mb-0.5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-xs print:mb-0">
                Análise por Critério (Radar)
              </h2>
              <ResponsiveContainer width="100%" height={910}>
                <RadarChart 
                  data={chartData.radar.scores.map((score: number, i: number) => ({
                    criterion: chartData.radar.labels[i],
                    score,
                    fullMark: 10,
                  }))}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="criterion" 
                    tick={{ fontSize: 21, fill: '#374151', fontWeight: 500 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 10]} 
                    tick={{ fontSize: 21, fill: '#374151' }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.bar && (
            <div className="print-chart-bar bg-white shadow rounded-lg p-6 mb-6 print-card print-keep-together print:p-1 print:mb-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-xs print:mb-0">
                Notas por Critério
              </h2>
            <ResponsiveContainer width="100%" height={Math.max(500, (chartData.bar.labels?.length || 8) * 45)}>
              <BarChart
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                data={chartData.bar.scores.map((score: number, i: number) => ({
                  name: chartData.bar.labels[i],
                  score,
                  fullName: chartData.bar.labels[i],
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 10]} 
                  tickCount={11} 
                  allowDecimals={false}
                  width={60}
                  tick={{ fontSize: 21 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={500}
                  tick={{ fontSize: 25, fill: '#374151', fontWeight: 500 }}
                  tickFormatter={(value) => {
                    if (!value || typeof value !== 'string') return ''
                    return value.length > 80 ? `${value.slice(0, 77)}…` : value
                  }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload
                    const fullName = p.fullName || p.name || ''
                    const score = p.score != null ? Number(p.score).toFixed(1) : '—'
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                        <div className="font-medium text-gray-700 mb-1">Critério</div>
                        <div className="text-gray-900 mb-2 break-words max-w-[360px]">{fullName}</div>
                        <div className="font-medium text-gray-700">Nota</div>
                        <div className="text-blue-600 font-semibold">{score} / 10</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Nota" barSize={30}>
                  {chartData.bar.scores.map((score: number, index: number) => {
                    // Determinar cor baseada no score
                    let barColor = '#ef4444' // vermelho (0-4)
                    if (score > 7) {
                      barColor = '#22c55e' // verde (>7)
                    } else if (score > 4) {
                      barColor = '#eab308' // amarelo (4-7)
                    }
                    return <Cell key={`cell-${index}`} fill={barColor} />
                  })}
                      <LabelList
                        dataKey="score"
                        position="right"
                        formatter={(value: number) => value.toFixed(1)}
                        style={{ fill: '#374151', fontSize: 25, fontWeight: 600 }}
                      />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 no-print print:hidden">
              Passe o mouse sobre a barra para ver o nome completo do critério.
            </p>
          </div>
          )}
          </div>
        </div>

        {/* Notas por Critério */}
        <div className="bg-white shadow rounded-lg p-6 mb-6 print-card print-keep-together print:p-3 print:mb-3">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-base print:mb-2">
            Análise Detalhada por Critério
          </h2>
          <div className="space-y-6 print:space-y-3">
            {criteria.map((criterion: any, index: number) => (
              <div key={index} className="border-b pb-4 last:border-b-0 print:pb-2">
                <div className="flex justify-between items-start mb-2 print:mb-1">
                  <h3 className="text-lg font-medium text-gray-900 print:text-sm">
                    {criterion.name}
                  </h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 print:text-base">
                      {criterion.score_0_10 != null ? criterion.score_0_10.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 print:text-xs">/ 10</div>
                  </div>
                </div>

                {criterion.positives && criterion.positives.length > 0 && (
                  <div className="mb-3 print:mb-1">
                    <h4 className="text-sm font-semibold text-green-700 mb-1 print:text-xs">
                      Pontos Positivos:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 print:text-xs">
                      {criterion.positives.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {criterion.improvements && criterion.improvements.length > 0 && (
                  <div className="mb-3 print:mb-1">
                    <h4 className="text-sm font-semibold text-orange-700 mb-1 print:text-xs">
                      Melhorias Sugeridas:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 print:text-xs">
                      {criterion.improvements.map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {criterion.evidence_quotes &&
                  criterion.evidence_quotes.length > 0 && (
                    <div className="print:mt-1">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1 print:text-xs">
                        Evidências:
                      </h4>
                      <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 print:p-2 print:text-xs">
                        {criterion.evidence_quotes.map((q: string, i: number) => (
                          <p key={i} className="mb-1 italic print:mb-0.5">
                            "{q}"
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>

        {/* Plano de Ação */}
        {report.insights?.action_plan &&
          report.insights.action_plan.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-6 print-card print-keep-together print:p-3 print:mb-3">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-base print:mb-2">
                Plano de Ação
              </h2>
              <p className="text-sm text-gray-600 mb-3 print:text-xs">
                Sugestões de melhorias para o closer
              </p>
              <ol className="list-decimal list-inside space-y-2 print:space-y-0.5 print:text-xs">
                {report.insights.action_plan.map((item: any, index: number) => (
                  <li key={index} className="text-gray-700">
                    <span className="font-medium">[{item.priority}]</span>{' '}
                    {item.action} <span className="text-gray-500">({item.criterion})</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

      </div>
    </SidebarLayout>
  )
}