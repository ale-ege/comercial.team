'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'
import SidebarLayout from '@/components/SidebarLayout'
import Select from '@/components/Select'
import Input from '@/components/Input'
import Button from '@/components/Button'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'

export default function DashboardsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    closerId: '',
    clientId: '',
    startDate: '',
    endDate: '',
  })
  const [closers, setClosers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [quickFilter, setQuickFilter] = useState<string | null>('total')

  type PresetKey = 'total' | 'semana-atual' | 'mes-atual' | '7d' | '30d' | '90d'
  const applyPreset = (key: PresetKey) => {
    setQuickFilter(key)
    const now = new Date()
    if (key === 'total') {
      setFilters((f) => ({ ...f, startDate: '', endDate: '' }))
      return
    }
    let start: Date
    let end: Date
    if (key === 'semana-atual') {
      start = startOfWeek(now, { weekStartsOn: 1 })
      end = endOfWeek(now, { weekStartsOn: 1 })
    } else if (key === 'mes-atual') {
      start = startOfMonth(now)
      end = endOfMonth(now)
    } else if (key === '7d') {
      end = now
      start = subDays(now, 6)
    } else if (key === '30d') {
      end = now
      start = subDays(now, 29)
    } else {
      end = now
      start = subDays(now, 89)
    }
    setFilters((f) => ({
      ...f,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    }))
  }

  useEffect(() => {
    fetch('/api/closers')
      .then((res) => res.json())
      .then((data) => setClosers(data.closers || []))
    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => setClients(data.clients || []))
  }, [])

  useEffect(() => {
    loadStats()
  }, [filters])

  const loadStats = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.closerId) params.append('closerId', filters.closerId)
    if (filters.clientId) params.append('clientId', filters.clientId)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const res = await fetch(`/api/dashboard/stats?${params}`)
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const STATUS_CORES: Record<string, string> = {
    'Fechado': 'bg-green-100 text-green-800 border-green-200',
    'Perdido': 'bg-red-100 text-red-800 border-red-200',
    'Agendar visita comercial': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Aguardando documentos': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Fazer proposta': 'bg-pink-100 text-pink-800 border-pink-200',
    'Proposta enviado': 'bg-sky-100 text-sky-800 border-sky-200',
    'Negociação': 'bg-blue-100 text-blue-800 border-blue-200',
    'Parceria': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Possível parceria': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Follow-up': 'bg-amber-100 text-amber-800 border-amber-200',
    'Sem interesse': 'bg-slate-100 text-slate-800 border-slate-200',
    'Sem retorno': 'bg-orange-100 text-orange-800 border-orange-200',
    'Outros': 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handleRankingBarClick = (data: any, index: number, e: any) => {
    if (!data || !stats.ranking || index === undefined) return
    
    const clickedEntry = stats.ranking[index]
    if (!clickedEntry || !clickedEntry.name) return
    
    // Encontrar o closer pelo nome
    const closer = closers.find((c: any) => c.name === clickedEntry.name)
    if (closer) {
      // Se já está filtrado pelo mesmo closer, limpar o filtro
      if (filters.closerId === closer.id) {
        setFilters({ ...filters, closerId: '' })
      } else {
        // Filtrar pelo closer clicado
        setFilters({ ...filters, closerId: closer.id })
      }
    }
  }

  const handleClearCloserFilter = () => {
    setFilters({ ...filters, closerId: '' })
  }

  return (
    <SidebarLayout currentModule="agente-comercial">
      <div className="print-dashboard">
        <div className="mb-6 flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-3xl font-bold text-gray-900 print:text-xl">Dashboards</h1>
          <div className="no-print print:hidden">
            <Button variant="secondary" onClick={handleExportPDF}>
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white shadow rounded-lg p-6 mb-6 no-print print:hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Closer"
              value={filters.closerId}
              onChange={(e) => setFilters({ ...filters, closerId: e.target.value })}
              options={[
                { value: '', label: 'Todos' },
                ...closers.map((c) => ({ value: c.id, label: c.name }))
              ]}
            />
            <Select
              label="Cliente"
              value={filters.clientId}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              options={[
                { value: '', label: 'Todos' },
                ...clients.map((c) => ({ value: c.id, label: c.name }))
              ]}
            />
            <Input
              label="Data Início"
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setQuickFilter(null)
                setFilters({ ...filters, startDate: e.target.value })
              }}
            />
            <Input
              label="Data Fim"
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setQuickFilter(null)
                setFilters({ ...filters, endDate: e.target.value })
              }}
            />
          </div>
          {/* Atalhos de período */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Período rápido</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('total')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'total'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Todos os dados (padrão)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Total
              </button>
              <button
                type="button"
                onClick={() => applyPreset('semana-atual')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'semana-atual'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Segunda a domingo da semana atual"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Semana atual
              </button>
              <button
                type="button"
                onClick={() => applyPreset('mes-atual')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'mes-atual'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Primeiro ao último dia do mês atual"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Mês atual
              </button>
              <button
                type="button"
                onClick={() => applyPreset('7d')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === '7d'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Últimos 7 dias (incluindo hoje)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Últimos 7 dias
              </button>
              <button
                type="button"
                onClick={() => applyPreset('30d')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === '30d'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Últimos 30 dias (incluindo hoje)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Últimos 30 dias
              </button>
              <button
                type="button"
                onClick={() => applyPreset('90d')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === '90d'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Últimos 90 dias (incluindo hoje)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Últimos 90 dias
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600 font-medium">Carregando...</div>
        ) : stats ? (
          <div className="print-dashboard-content">
            {/* Linha 1: Reuniões realizadas, Oportunidades geradas, Propostas apresentadas, Vendas — abaixo Meta % e Realizado — Verde = na meta, Amarelo = até 5% fora, Vermelho = fora da meta */}
            {(() => {
              const total = stats.totalReports ?? 0
              const leadSum = stats.leadSum ?? 0
              const leadWeeksCount = stats.leadWeeksCount ?? 0
              // Média de lead por dia na semana × quantidade de dias do filtro
              const leadPerDayInWeek = leadWeeksCount > 0 ? leadSum / (leadWeeksCount * 7) : 0
              const periodDays = stats.periodDays ?? (filters.startDate && filters.endDate
                ? Math.max(1, Math.ceil((new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / (24 * 60 * 60 * 1000)))
                : 7)
              const totalLead = Math.round(leadPerDayInWeek * periodDays)
              const metaLeadPorSemana = stats.metas?.metaLeadPorSemana ?? 60
              const metaPorSemana = stats.metas?.metaReunioesSemanaGeral ?? 21
              const metaOportunidade = stats.metas?.metaGeracaoOportunidade ?? 75
              const metaProposta = stats.metas?.metaEnvioProposta ?? 50
              const metaVendas = stats.metas?.metaConversao ?? 15
              const semanas = periodDays / 7
              const metaLead = Math.round(metaLeadPorSemana * semanas)
              const pctLead = metaLead > 0 ? (totalLead / metaLead) * 100 : 0
              const metaTaxaReunioes = 35
              const pctTaxaReunioes = totalLead > 0 ? (total / totalLead) * 100 : 0
              const metaReunioesBase = Math.round(metaPorSemana * semanas)
              const divisorCloser = filters.closerId && closers.length > 1 ? Math.max(1, closers.length - 1) : 1
              const metaReunioes = Math.round(metaReunioesBase / divisorCloser)
              const metaOportunidadeNum = Math.round(total * (metaOportunidade / 100))
              const metaPropostaNum = Math.round(total * (metaProposta / 100))
              const metaVendasNum = Math.round(total * (metaVendas / 100))
              const pctOportunidade = total > 0 ? ((stats.totalOportunidadesGeradas ?? 0) / total) * 100 : 0
              const totalPropostasApresentadas = stats.totalPropostaEnviadoENegociacao ?? (stats.totalPropostaEnviado ?? 0)
              const pctProposta = total > 0 ? (totalPropostasApresentadas / total) * 100 : 0
              const pctVendas = totalPropostasApresentadas > 0 ? ((stats.totalFechado ?? 0) / totalPropostasApresentadas) * 100 : 0
              const corMeta = (realizado: number, meta: number) =>
                realizado >= meta ? 'bg-green-50 border-green-300' : realizado >= meta - 5 ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300'
              return (
                <>
                  {/* Linha 1: Quantidade de Lead, Reuniões realizadas, Oportunidades geradas, Negócios gerados, Vendas (número + barra com meta) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6 print:gap-2 print:mb-2">
                    <div className="bg-white shadow rounded-lg p-6 print:p-2 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">Quantidade de Lead</h3>
                      <p className="text-3xl font-bold text-gray-900 print:text-xl">{totalLead}</p>
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${metaLead > 0 ? Math.min(100, (totalLead / metaLead) * 100) : 0}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Meta: {metaLead}</p>
                      </div>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6 print:p-2 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">Reuniões realizadas</h3>
                      <p className="text-3xl font-bold text-gray-900 print:text-xl">{total}</p>
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${metaReunioes > 0 ? Math.min(100, (total / metaReunioes) * 100) : 0}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Meta: {metaReunioes}</p>
                      </div>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6 print:p-2 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">Oportunidades geradas</h3>
                      <p className="text-3xl font-bold text-gray-900 print:text-xl">{stats.totalOportunidadesGeradas ?? 0}</p>
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${metaOportunidadeNum > 0 ? Math.min(100, ((stats.totalOportunidadesGeradas ?? 0) / metaOportunidadeNum) * 100) : 0}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Meta: {metaOportunidadeNum}</p>
                      </div>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6 print:p-2 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">Negócios gerados</h3>
                      <p className="text-3xl font-bold text-gray-900 print:text-xl">{totalPropostasApresentadas}</p>
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${metaPropostaNum > 0 ? Math.min(100, (totalPropostasApresentadas / metaPropostaNum) * 100) : 0}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Meta: {metaPropostaNum}</p>
                      </div>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6 print:p-2 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">Vendas</h3>
                      <p className="text-3xl font-bold text-gray-900 print:text-xl">{stats.totalFechado ?? 0}</p>
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${metaVendasNum > 0 ? Math.min(100, ((stats.totalFechado ?? 0) / metaVendasNum) * 100) : 0}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Meta: {metaVendasNum}</p>
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: Meta e Realizado em % (com cores onde há meta em %) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6 print:gap-2 print:mb-2">
                    <div className={`shadow rounded-lg p-6 print:p-2 border-2 ${corMeta(pctLead, 100)}`}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">Quantidade de Lead</h3>
                      <p className="text-xs text-gray-600 mb-0.5">Meta: {metaLead} ({metaLeadPorSemana}/semana × {semanas.toFixed(1)} sem)</p>
                      <p className="text-lg font-bold text-gray-900">Realizado: {pctLead.toFixed(1)}%</p>
                    </div>
                    <div className={`shadow rounded-lg p-6 print:p-2 border-2 ${corMeta(pctTaxaReunioes, metaTaxaReunioes)}`}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">Taxa de realização de reuniões</h3>
                      <p className="text-xs text-gray-600 mb-0.5">Meta: {metaTaxaReunioes}%</p>
                      <p className="text-lg font-bold text-gray-900">Realizado: {pctTaxaReunioes.toFixed(1)}%</p>
                    </div>
                    <div className={`shadow rounded-lg p-6 print:p-2 border-2 ${corMeta(pctOportunidade, metaOportunidade)}`}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">Oportunidades geradas</h3>
                      <p className="text-xs text-gray-600 mb-0.5">Meta: {metaOportunidade}%</p>
                      <p className="text-lg font-bold text-gray-900">Realizado: {pctOportunidade.toFixed(1)}%</p>
                    </div>
                    <div className={`shadow rounded-lg p-6 print:p-2 border-2 ${corMeta(pctProposta, metaProposta)}`}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">% geração de negócios</h3>
                      <p className="text-xs text-gray-600 mb-0.5">Meta: {metaProposta}%</p>
                      <p className="text-lg font-bold text-gray-900">Realizado: {pctProposta.toFixed(1)}%</p>
                    </div>
                    <div className={`shadow rounded-lg p-6 print:p-2 border-2 ${corMeta(pctVendas, metaVendas)}`}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">Vendas</h3>
                      <p className="text-xs text-gray-600 mb-0.5">Meta: {metaVendas}%</p>
                      <p className="text-lg font-bold text-gray-900">Realizado: {pctVendas.toFixed(1)}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 flex flex-wrap gap-4">
                    <span><span className="inline-block w-3 h-3 rounded bg-green-200 border border-green-400 mr-1" /> Na meta</span>
                    <span><span className="inline-block w-3 h-3 rounded bg-amber-200 border border-amber-400 mr-1" /> Até 5% fora da meta</span>
                    <span><span className="inline-block w-3 h-3 rounded bg-red-200 border border-red-400 mr-1" /> Fora da meta</span>
                  </p>
                </>
              )
            })()}

            {/* Indicadores por Status */}
            {stats.statusIndicators && stats.statusIndicators.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-6 print:p-2 print:mb-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-sm print:mb-1">
                  Indicadores por Status
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 print:gap-1">
                  {stats.statusIndicators.map((item: { status: string; count: number }) => (
                    <div
                      key={item.status}
                      className={`rounded-lg border px-4 py-3 text-center print:px-2 print:py-1 ${
                        STATUS_CORES[item.status] ?? 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      <div className="text-2xl font-bold print:text-lg">{item.count}</div>
                      <div className="text-xs font-medium truncate" title={item.status === 'Fechado' ? 'Venda' : item.status}>
                        {item.status === 'Fechado' ? 'Venda' : item.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KPIs - Nota média, Média Geral, Desvio Padrão, Maior Nota */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 print:gap-2 print:mb-2">
              <div className="bg-white shadow rounded-lg p-6 print:p-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">
                  Nota média últimas 5 reuniões
                </h3>
                <div className="text-3xl font-bold text-teal-600 print:text-xl">
                  {stats.averageLast5Meetings != null ? stats.averageLast5Meetings.toFixed(1) : '—'}
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6 print:p-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">
                  Média Geral
                </h3>
                <div className="text-3xl font-bold text-blue-600 print:text-xl">
                  {stats.closerAverages && stats.closerAverages.length > 0
                    ? (
                        stats.closerAverages.reduce(
                          (sum: number, c: any) => sum + (c.average || 0),
                          0
                        ) / stats.closerAverages.length
                      ).toFixed(1)
                    : '0.0'}
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6 print:p-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">
                  Desvio Padrão
                </h3>
                <div className="text-3xl font-bold text-purple-600 print:text-xl">
                  {stats.standardDeviation != null ? stats.standardDeviation.toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6 print:p-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs print:mb-1">
                  Maior Nota
                </h3>
                <div className="text-3xl font-bold text-green-600 print:text-xl">
                  {stats.maxScore != null ? stats.maxScore.toFixed(1) : '0.0'}
                </div>
              </div>
            </div>

            {/* Ranking */}
            {stats.ranking && stats.ranking.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-6 print:p-2 print:mb-2">
                <div className="flex justify-between items-center mb-4 print:mb-1">
                  <h2 className="text-xl font-semibold text-gray-900 print:text-sm">
                    Ranking de Closers (Média Geral)
                  </h2>
                  {filters.closerId && (
                    <button
                      onClick={handleClearCloserFilter}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium underline no-print print:hidden"
                      title="Limpar filtro de closer"
                    >
                      Limpar Filtro
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2 no-print print:hidden">
                  Clique em uma barra para filtrar os dados por esse closer
                </p>
                <ResponsiveContainer width="100%" height={Math.max(300, stats.ranking.length * 40)}>
                  <BarChart 
                    data={stats.ranking}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: any) => value != null ? `${value.toFixed(1)} pontos` : 'N/A'}
                      labelFormatter={(label: string) => `Closer: ${label}`}
                    />
                    <Bar 
                      dataKey="average" 
                      fill="#3b82f6" 
                      radius={[0, 4, 4, 0]}
                      onClick={handleRankingBarClick}
                      style={{ cursor: 'pointer' }}
                    >
                      {stats.ranking.map((entry: any, index: number) => {
                        const isSelected = filters.closerId && closers.find((c: any) => c.id === filters.closerId && c.name === entry.name)
                        return (
                          <Cell 
                            key={`cell-${entry.name}-${index}`} 
                            fill={isSelected ? '#1e40af' : COLORS[index % COLORS.length]}
                            style={{ cursor: 'pointer' }}
                          />
                        )
                      })}
                      <LabelList
                        dataKey="average"
                        position="right"
                        formatter={(value: number) => value.toFixed(1)}
                        style={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico de linhas: nota média por closer (dados semanais, últimas 52 semanas) */}
            {stats.rankingWeeklyEvolution && stats.rankingWeeklyEvolution.length > 0 && stats.rankingCloserNames && stats.rankingCloserNames.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-6 print:p-2 print:mb-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-sm print:mb-1">
                  Nota média por Closer (últimas 52 semanas)
                </h2>
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart
                    data={stats.rankingWeeklyEvolution}
                    margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={72}
                      interval={Math.max(0, Math.floor((stats.rankingWeeklyEvolution?.length || 52) / 16))}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <ReferenceLine
                      y={stats.metas?.metaNotaCloser ?? 70}
                      stroke="#22c55e"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{ value: `Meta: ${stats.metas?.metaNotaCloser ?? 70}`, position: 'right', fill: '#22c55e', fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: any) => value != null ? `${Number(value).toFixed(1)} pontos` : '—'}
                      labelFormatter={(label) => `Semana: ${label}`}
                    />
                    <Legend />
                    {stats.rankingCloserNames.map((closerName: string, index: number) => (
                      <Line
                        key={closerName}
                        type="monotone"
                        dataKey={closerName}
                        name={closerName}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Quantidade de reuniões por semana (ano inteiro) */}
            {stats.meetingsPerWeek && stats.meetingsPerWeek.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-6 print:p-2 print:mb-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-sm print:mb-1">
                  Quantidade de reuniões por semana (últimas 52 semanas)
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={stats.meetingsPerWeek}
                    margin={{ top: 8, right: 16, left: 0, bottom: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="weekLabel"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={56}
                      interval={Math.max(0, Math.floor(stats.meetingsPerWeek.length / 24))}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <ReferenceLine
                      y={filters.closerId ? (stats.metas?.metaReunioesSemanaPorCloser ?? 5) : (stats.metas?.metaLeadPorSemana ?? 60)}
                      stroke="#22c55e"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{
                        value: `Meta: ${filters.closerId ? (stats.metas?.metaReunioesSemanaPorCloser ?? 5) : (stats.metas?.metaLeadPorSemana ?? 60)}`,
                        position: 'right',
                        fill: '#22c55e',
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} reuniões`, 'Total']}
                      labelFormatter={(label: string) => `Semana: ${label}`}
                    />
                    <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} name="Reuniões" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Evolução Mensal */}
            {stats.monthlyEvolution && stats.monthlyEvolution.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-6 print:p-2 print:mb-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-sm print:mb-1">
                  Evolução Mensal (Média Geral)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart 
                    data={stats.monthlyEvolution}
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: any) => value != null ? `${value.toFixed(1)} pontos` : 'N/A'}
                      labelFormatter={(label: string) => `Mês: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Média"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Distribuição por Critério */}
            {stats.criteriaAverages && stats.criteriaAverages.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-6 print:p-2 print:mb-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-sm print:mb-1">
                  Distribuição por Critério
                </h2>
                <ResponsiveContainer width="100%" height={520}>
                  <RadarChart data={stats.criteriaAverages}>
                    <PolarGrid />
                    <PolarAngleAxis 
                      dataKey="name" 
                      tick={{ fontSize: 14, fill: '#374151', fontWeight: 500 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 10]} 
                      tick={{ fontSize: 14, fill: '#374151' }}
                    />
                    <Radar
                      name="Média"
                      dataKey="average"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Tooltip 
                      formatter={(value: any) => value != null ? value.toFixed(1) : 'N/A'}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Heatmap */}
            {stats.heatmap && stats.heatmap.length > 0 && (() => {
              // Garantir que todos os closers tenham os mesmos critérios na mesma ordem
              const allCriteriaNames = stats.heatmap[0]?.criteria?.map((c: any) => c.criterion) || []
              
              return (
                <div className="bg-white shadow rounded-lg p-6 print:p-2">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-sm print:mb-1">
                    Heatmap: Closer x Critério (Médias)
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 print:text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200 sticky left-0 bg-gray-50 z-10 print:px-2 print:py-1">
                            Closer
                          </th>
                          {allCriteriaNames.map((criterionName: string, idx: number) => (
                            <th 
                              key={`header-${criterionName}-${idx}`}
                              className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[100px] max-w-[140px] align-bottom print:px-1 print:py-1"
                              title={criterionName}
                            >
                              <div className="whitespace-normal break-words leading-tight max-w-[140px] mx-auto print:text-xs">
                                {criterionName || 'N/A'}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.heatmap.map((row: any, rowIdx: number) => {
                          // Criar um mapa dos critérios desta linha para acesso rápido
                          const criteriaMap = new Map(
                            (row.criteria || []).map((c: any) => [c.criterion, c.average])
                          )
                          
                          return (
                            <tr key={`row-${row.closer}-${rowIdx}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-200 sticky left-0 bg-white z-10 print:px-2 print:py-1 print:text-xs">
                                {row.closer || 'N/A'}
                              </td>
                              {allCriteriaNames.map((criterionName: string, idx: number) => {
                                const average = criteriaMap.get(criterionName) || 0
                                const intensity = Math.min(average / 10, 1)
                                const bgColor = `rgba(59, 130, 246, ${intensity * 0.3})`
                                
                                return (
                                  <td
                                    key={`cell-${row.closer}-${criterionName}-${idx}`}
                                    className="px-4 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900 print:px-1 print:py-1 print:text-xs"
                                    style={{ backgroundColor: bgColor }}
                                  >
                                    {average > 0 ? average.toFixed(1) : '-'}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 font-medium">Nenhum dado disponível</p>
            <p className="text-gray-500 text-sm mt-2">Ajuste os filtros ou processe algumas análises primeiro.</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}