'use client'

import { useState, useEffect } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import Button from '@/components/Button'
import { format, getISOWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Entry {
  weekId: string
  label: string
  total: number
  visitas: number
}

/** Segunda-feira da semana da data (ISO: semana começa na segunda) */
function getMonday(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

/** weekId no formato YYYY-Www */
function getWeekId(monday: Date): string {
  const y = format(monday, 'yyyy')
  const w = String(getISOWeek(monday)).padStart(2, '0')
  return `${y}-W${w}`
}

/** Label da semana: "DD/MM/YYYY - DD/MM/YYYY" */
function getWeekLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${format(monday, 'dd/MM/yyyy', { locale: ptBR })} - ${format(sunday, 'dd/MM/yyyy', { locale: ptBR })}`
}

// Função para ordenar semanas da mais recente para a mais antiga (weekId no formato YYYY-Www)
function sortEntriesDesc(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    // Comparar weekId (formato YYYY-Www) em ordem decrescente
    return b.weekId.localeCompare(a.weekId)
  })
}

export default function GeracaoLeadPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [weekDate, setWeekDate] = useState<string>(() => {
    const d = new Date()
    return format(d, 'yyyy-MM-dd')
  })
  const [newTotal, setNewTotal] = useState<string>('')
  const [newVisitas, setNewVisitas] = useState<string>('')

  useEffect(() => {
    fetch('/api/settings/geracao-lead')
      .then((res) => res.json())
      .then((data) => {
        const mapped = (data.entries || []).map((e: Entry) => ({ ...e, visitas: e.visitas ?? 0 }))
        setEntries(sortEntriesDesc(mapped))
      })
      .catch(() => setMessage({ type: 'error', text: 'Erro ao carregar dados.' }))
      .finally(() => setLoading(false))
  }, [])

  const addRow = () => {
    if (!weekDate) return
    const date = new Date(weekDate + 'T12:00:00')
    const monday = getMonday(date)
    const weekId = getWeekId(monday)
    const label = getWeekLabel(monday)
    const already = entries.some((e) => e.weekId === weekId)
    if (already) {
      setMessage({ type: 'error', text: 'Esta semana já está na tabela.' })
      return
    }
    const total = Math.max(0, Number(newTotal) || 0)
    const visitas = Math.max(0, Number(newVisitas) || 0)
    setEntries((prev) => sortEntriesDesc([...prev, { weekId, label, total, visitas }]))
    setNewTotal('')
    setNewVisitas('')
    setMessage(null)
  }

  const updateTotal = (weekId: string, value: string) => {
    const num = value === '' ? 0 : Math.max(0, Number(value) || 0)
    setEntries((prev) =>
      prev.map((e) => (e.weekId === weekId ? { ...e, total: num } : e))
    )
  }

  const updateVisitas = (weekId: string, value: string) => {
    const num = value === '' ? 0 : Math.max(0, Number(value) || 0)
    setEntries((prev) =>
      prev.map((e) => (e.weekId === weekId ? { ...e, visitas: num } : e))
    )
  }

  const removeRow = (weekId: string) => {
    setEntries((prev) => prev.filter((e) => e.weekId !== weekId))
    setMessage(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/settings/geracao-lead', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: entries.map((e) => ({ weekId: e.weekId, total: e.total, visitas: e.visitas ?? 0 })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Erro ao salvar.')
        setMessage({ type: 'error', text: msg })
        return
      }
      if (data.entries) {
        const mapped = data.entries.map((e: Entry) => ({ ...e, visitas: e.visitas ?? 0 }))
        setEntries(sortEntriesDesc(mapped))
      }
      setMessage({ type: 'success', text: 'Dados salvos com sucesso.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao salvar. Verifique a conexão.' })
    } finally {
      setSaving(false)
    }
  }

  const weekLabelPreview = weekDate
    ? (() => {
        const date = new Date(weekDate + 'T12:00:00')
        const monday = getMonday(date)
        return getWeekLabel(monday)
      })()
    : ''

  return (
    <SidebarLayout currentModule="agente-comercial">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Geração de Lead</h1>
        <p className="text-gray-600 mb-6">
          Adicione a semana (escolha qualquer dia da semana), a quantidade de leads e de visitas. Depois clique em &quot;Salvar tudo&quot;.
        </p>

        <div className="bg-white shadow rounded-lg p-6">
          {loading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : (
            <>
              {/* Adicionar semana */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h2 className="text-sm font-semibold text-gray-800 mb-3">Adicionar semana</h2>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data (qualquer dia da semana)
                    </label>
                    <input
                      type="date"
                      value={weekDate}
                      onChange={(e) => setWeekDate(e.target.value)}
                      className="block w-full min-w-[180px] rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    {weekLabelPreview && (
                      <p className="mt-1 text-xs text-gray-500">
                        Semana: {weekLabelPreview}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade de lead
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newTotal}
                      onChange={(e) => setNewTotal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addRow()}
                      className="block w-32 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visitas
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newVisitas}
                      onChange={(e) => setNewVisitas(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addRow()}
                      className="block w-32 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <Button onClick={addRow}>Adicionar</Button>
                </div>
              </div>

              {message && (
                <p
                  className={`mb-4 text-sm ${
                    message.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {message.text}
                </p>
              )}

              <div className="flex justify-end mb-4">
                <Button onClick={handleSave} loading={saving}>
                  Salvar tudo
                </Button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Semana (início – fim)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-40">
                        Quantidade de lead
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-40">
                        Visitas
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                          Nenhuma semana adicionada. Escolha uma data acima e clique em Adicionar.
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.weekId} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {entry.label}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              value={String(entry.total)}
                              onChange={(e) => updateTotal(entry.weekId, e.target.value)}
                              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              value={String(entry.visitas ?? 0)}
                              onChange={(e) => updateVisitas(entry.weekId, e.target.value)}
                              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeRow(entry.weekId)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {entries.length > 0 && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSave} loading={saving}>
                    Salvar tudo
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  )
}
