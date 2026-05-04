'use client'

import { useState, useEffect } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface WeekData {
  weekId: string
  label: string
  visitas: number
  leads: number
  agendamentos: number
  percentLeadVisitas: number
  percentReuniaoLeads: number
}

export default function IndicadoresGeracaoLeadPage() {
  const [weeksData, setWeeksData] = useState<WeekData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/indicadores/geracao-lead')
      if (!res.ok) {
        throw new Error('Erro ao carregar dados')
      }
      const data = await res.json()
      setWeeksData(data.weeks || [])
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error)
    } finally {
      setLoading(false)
    }
  }

  // Preparar dados para o gráfico (últimos 3 meses - 12 semanas)
  const chartData = weeksData.map((week) => ({
    semana: week.label.split(' - ')[0], // Apenas data inicial para o eixo X
    visitas: week.visitas,
    leads: week.leads,
    agendamentos: week.agendamentos,
  }))

  // Calcular totais e médias para a tabela
  const totals = weeksData.reduce(
    (acc, week) => ({
      visitas: acc.visitas + week.visitas,
      leads: acc.leads + week.leads,
      agendamentos: acc.agendamentos + week.agendamentos,
    }),
    { visitas: 0, leads: 0, agendamentos: 0 }
  )

  const avgPercentLeadVisitas =
    weeksData.length > 0
      ? weeksData.reduce((sum, w) => sum + w.percentLeadVisitas, 0) / weeksData.length
      : 0

  const avgPercentReuniaoLeads =
    weeksData.length > 0
      ? weeksData.reduce((sum, w) => sum + w.percentReuniaoLeads, 0) / weeksData.length
      : 0

  const overallPercentLeadVisitas =
    totals.visitas > 0 ? (totals.leads / totals.visitas) * 100 : 0

  const overallPercentReuniaoLeads =
    totals.leads > 0 ? (totals.agendamentos / totals.leads) * 100 : 0

  return (
    <SidebarLayout currentModule="agente-comercial">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Indicadores Geração de Lead</h1>
          <p className="text-gray-600">
            Visualização dos últimos 3 meses (12 semanas): visitas, leads gerados e agendamentos realizados.
          </p>
        </div>

        {loading ? (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500 text-center py-8">Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* Gráfico de Barras */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Visitas, Leads e Agendamentos por Semana (Últimos 3 Meses - 12 Semanas)
              </h2>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="semana"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number) => value.toLocaleString('pt-BR')}
                  />
                  <Legend />
                  <Bar dataKey="visitas" fill="#3b82f6" name="Visitas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leads" fill="#22c55e" name="Leads" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="agendamentos" fill="#f59e0b" name="Agendamentos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Resumo Geral */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
              <h2 className="text-xl font-semibold mb-4">Resumo Geral (Últimos 3 Meses - 12 Semanas)</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-sm opacity-90">Total de Visitas</div>
                  <div className="text-2xl font-bold">{totals.visitas.toLocaleString('pt-BR')}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Total de Leads</div>
                  <div className="text-2xl font-bold">{totals.leads.toLocaleString('pt-BR')}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Total de Agendamentos</div>
                  <div className="text-2xl font-bold">{totals.agendamentos.toLocaleString('pt-BR')}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">% Lead / Visitas</div>
                  <div className="text-2xl font-bold">{overallPercentLeadVisitas.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">% Reunião / Leads</div>
                  <div className="text-2xl font-bold">{overallPercentReuniaoLeads.toFixed(2)}%</div>
                </div>
              </div>
            </div>

            {/* Tabela de Percentuais */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Percentuais de Conversão por Semana
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semana
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visitas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leads
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agendamentos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Lead / Visitas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Reunião / Leads
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeksData.map((week) => (
                      <tr key={week.weekId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {week.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {week.visitas.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {week.leads.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {week.agendamentos.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span
                            className={`font-medium ${
                              week.percentLeadVisitas >= 10
                                ? 'text-green-600'
                                : week.percentLeadVisitas >= 5
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {week.percentLeadVisitas.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span
                            className={`font-medium ${
                              week.percentReuniaoLeads >= 50
                                ? 'text-green-600'
                                : week.percentReuniaoLeads >= 30
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {week.percentReuniaoLeads.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Linha de totais/médias */}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <strong>Total / Média</strong>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {totals.visitas.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {totals.leads.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {totals.agendamentos.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        <span className="font-bold">
                          {overallPercentLeadVisitas.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        <span className="font-bold">
                          {overallPercentReuniaoLeads.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  )
}
