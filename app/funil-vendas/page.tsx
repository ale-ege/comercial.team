'use client'

import { useState, useEffect, useMemo } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import Input from '@/components/Input'
import { subDays, format } from 'date-fns'
import {
  FunnelChart,
  Funnel,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts'

interface FunnelStage {
  key: string
  label: string
  description: string
  count: number
  conversionFromPrevious: number | null
  conversionFromLeads: number | null
}

interface FunilData {
  total: number
  leadSum?: number
  visitasSum?: number
  stages: FunnelStage[]
}

const STAGE_COLORS = ['#3b82f6', '#0ea5e9', '#06b6d4', '#0891b2', '#0d9488', '#10b981', '#059669']

export default function FunilVendasPage() {
  const [data, setData] = useState<FunilData | null>(null)
  const [loading, setLoading] = useState(true)
  const [closers, setClosers] = useState<{ id: string; name: string }[]>([])
  const [selectedCloserIds, setSelectedCloserIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetch('/api/closers')
      .then((res) => res.json())
      .then((result) => setClosers(result.closers || []))
      .catch(console.error)
  }, [])

  const applyShortcut = (days: number) => {
    const end = new Date()
    const start = subDays(end, days)
    setEndDate(format(end, 'yyyy-MM-dd'))
    setStartDate(format(start, 'yyyy-MM-dd'))
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCloserIds.length > 0) {
      params.set('closerIds', selectedCloserIds.join(','))
    }
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    fetch(`/api/funil?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (!cancelled) setData({ total: result.total, stages: result.stages || [] })
      })
      .catch(() => {
        if (!cancelled) setData({ total: 0, stages: [] })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedCloserIds, startDate, endDate])

  const chartData = useMemo(() => {
    if (!data?.stages.length) return []
    return data.stages.map((s, i) => ({
      name: s.label,
      value: s.count,
      fill: STAGE_COLORS[i % STAGE_COLORS.length],
      conversionFromPrevious: s.conversionFromPrevious,
      conversionFromLeads: s.conversionFromLeads,
    }))
  }, [data])

  const toggleCloser = (id: string) => {
    setSelectedCloserIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const selectAllClosers = () => {
    setSelectedCloserIds(closers.map((c) => c.id))
  }

  const clearClosers = () => {
    setSelectedCloserIds([])
  }

  return (
    <SidebarLayout currentModule="agente-comercial">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Funil de Vendas</h1>
        <p className="text-gray-600 mb-6">
          Visualização dinâmica das etapas do processo comercial. Ajuste os filtros para recalcular quantidades e taxas de conversão.
        </p>

        {/* Filtros */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Closer(s) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Closer(s)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={selectAllClosers}
                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={clearClosers}
                  className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Limpar
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                {closers.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum closer cadastrado.</p>
                ) : (
                  closers.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCloserIds.includes(c.id)}
                        onChange={() => toggleCloser(c.id)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{c.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedCloserIds.length === 0
                  ? 'Todos os closers'
                  : `${selectedCloserIds.length} selecionado(s)`}
              </p>
            </div>

            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => applyShortcut(7)}
                  className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  7 dias
                </button>
                <button
                  type="button"
                  onClick={() => applyShortcut(30)}
                  className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  30 dias
                </button>
                <button
                  type="button"
                  onClick={() => applyShortcut(90)}
                  className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  90 dias
                </button>
              </div>
              <div className="space-y-2">
                <Input
                  label="Data inicial"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="Data final"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo: funil + tabela de conversão */}
        {loading ? (
          <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
            Carregando funil...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico do funil */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Etapas do funil
              </h2>
              {chartData.length === 0 ? (
                <div className="h-[480px] flex items-center justify-center text-gray-500">
                  Nenhum dado no período selecionado.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={960}>
                  <FunnelChart data={chartData} layout="centric">
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        value,
                        `${props.payload?.name ?? name} — ${value} oportunidades`,
                      ]}
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Funnel dataKey="value" data={chartData} isAnimationActive>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList
                        position="center"
                        fill="#1e293b"
                        stroke="#fff"
                        strokeWidth={1.5}
                        dataKey="value"
                        formatter={(value: number) => value}
                        style={{ fontSize: 36, fontWeight: 700 }}
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tabela: quantidade e conversão */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Quantidade e conversão
              </h2>
              {!data?.stages.length ? (
                <p className="text-sm text-gray-500">Nenhuma etapa para exibir.</p>
              ) : (
                <div className="space-y-3">
                  {data.stages.map((stage, i) => (
                    <div
                      key={stage.key}
                      className="border border-gray-200 rounded-lg p-3"
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: STAGE_COLORS[i % STAGE_COLORS.length],
                      }}
                    >
                      <div className="font-medium text-gray-900">{stage.label}</div>
                      <div className="text-2xl font-bold text-gray-800 mt-1">
                        {stage.count}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(stage.key === 'visitas' || stage.key === 'lead') && (
                          <span className="block">Tabela Geração de Lead</span>
                        )}
                        {stage.conversionFromLeads != null && (
                          <span>{stage.conversionFromLeads}% do total (visitas)</span>
                        )}
                        {stage.conversionFromPrevious != null && i > 0 && (
                          <span className="block">
                            {stage.conversionFromPrevious}% da etapa anterior
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {data && (
          <p className="text-sm text-gray-500 mt-4">
            Reuniões no período: <strong>{data.total}</strong>
            {data.visitasSum != null && (
              <> · Visitas: <strong>{data.visitasSum}</strong></>
            )}
            {data.leadSum != null && (
              <> · Leads: <strong>{data.leadSum}</strong></>
            )}
          </p>
        )}
      </div>
    </SidebarLayout>
  )
}
