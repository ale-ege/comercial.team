import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const KEY_GERACAO_LEAD = 'geracaoLead_entries'

/** Converte weekId (ex: 2024-W49) para a segunda-feira dessa semana ISO */
function weekIdToMonday(weekId: string): Date | null {
  const match = /^(\d{4})-W(\d{1,2})$/.exec(weekId)
  if (!match) return null
  const y = parseInt(match[1], 10)
  const w = parseInt(match[2], 10)
  const jan4 = new Date(y, 0, 4)
  const day = jan4.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() + mondayOffset)
  const monday = new Date(week1Monday)
  monday.setDate(week1Monday.getDate() + (w - 1) * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/** Soma leads e visitas da tabela Geração de Lead no período [startDate, endDate]. Sem período = soma todos. */
async function getLeadAndVisitasFromGeracao(
  startDate: string,
  endDate: string
): Promise<{ leadSum: number; visitasSum: number }> {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: KEY_GERACAO_LEAD },
    })
    if (!row?.value) return { leadSum: 0, visitasSum: 0 }
    const parsed = JSON.parse(row.value)
    if (!Array.isArray(parsed)) return { leadSum: 0, visitasSum: 0 }
    const entries = parsed.filter(
      (e: any) => e && typeof e.weekId === 'string' && (typeof e.total === 'number' || typeof e.total === 'string')
    ) as { weekId: string; total: number; visitas?: number }[]
    const start = startDate ? (() => {
      const d = new Date(startDate)
      d.setHours(0, 0, 0, 0)
      return d
    })() : null
    const end = endDate ? (() => {
      const d = new Date(endDate)
      d.setHours(23, 59, 59, 999)
      return d
    })() : null
    let leadSum = 0
    let visitasSum = 0
    for (const e of entries) {
      const monday = weekIdToMonday(e.weekId)
      if (!monday) continue
      monday.setHours(0, 0, 0, 0)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)
      // Incluir semana se ela se sobrepõe ao período: (monday <= end) && (sunday >= start)
      if (start && sunday < start) continue
      if (end && monday > end) continue
      leadSum += Number(e.total) || 0
      visitasSum += Math.max(0, Number(e.visitas) || 0)
    }
    return { leadSum, visitasSum }
  } catch {
    return { leadSum: 0, visitasSum: 0 }
  }
}

/** Etapas do funil (ordem: topo → base). 1 Visitas, 2 Lead, 3 Reunião realizada, ... */
const FUNNEL_STAGES = [
  {
    key: 'visitas',
    label: 'Visitas',
    description: 'Somatório da tabela Geração de Lead (visitas)',
    statuses: null,
  },
  {
    key: 'lead',
    label: 'Lead',
    description: 'Somatório da tabela Geração de Lead (leads)',
    statuses: null,
  },
  {
    key: 'reuniao_realizada',
    label: 'Reunião realizada',
    description: 'Total de reuniões realizadas',
    statuses: null,
  },
  {
    key: 'oportunidades_geradas',
    label: 'Oportunidades geradas',
    description: 'Aguardando doc., Fazer proposta, Proposta enviado, Negociação, Parceria, Possível parceria, Follow-up',
    statuses: [
      'Aguardando documentos',
      'Fazer proposta',
      'Proposta enviado',
      'Negociação',
      'Parceria',
      'Possível parceria',
      'Follow-up',
    ],
  },
  {
    key: 'propostas_apresentadas',
    label: 'Propostas apresentadas',
    description: 'Proposta enviado + Negociação',
    statuses: ['Proposta enviado', 'Negociação'],
  },
  {
    key: 'negociacao',
    label: 'Negociação',
    description: 'Em negociação',
    statuses: ['Negociação'],
  },
  {
    key: 'venda',
    label: 'Venda',
    description: 'Negócios fechados',
    statuses: ['Fechado'],
  },
] as const

export type FunnelStageKey = (typeof FUNNEL_STAGES)[number]['key']

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const closerIdsParam = searchParams.get('closerIds')?.trim() || ''
    const startDate = searchParams.get('startDate')?.trim() || ''
    const endDate = searchParams.get('endDate')?.trim() || ''

    const whereMeeting: { closerId?: string | { in: string[] }; createdAt?: { gte?: Date; lte?: Date } } = {}

    if (closerIdsParam) {
      const ids = closerIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
      if (ids.length === 1) {
        whereMeeting.closerId = ids[0]
      } else if (ids.length > 1) {
        whereMeeting.closerId = { in: ids }
      }
    }

    if (startDate || endDate) {
      whereMeeting.createdAt = {}
      if (startDate) whereMeeting.createdAt.gte = new Date(startDate)
      if (endDate) whereMeeting.createdAt.lte = new Date(endDate)
    }

    const reports = await prisma.report.findMany({
      where: { meeting: whereMeeting },
      select: { dealStatus: true },
    })

    const totalReunioes = reports.length
    const { leadSum, visitasSum } = await getLeadAndVisitasFromGeracao(startDate, endDate)

    const normalizedStatus = (s: string | null) =>
      s?.trim() || 'Outros'

    const countByStatus: Record<string, number> = {}
    reports.forEach((r) => {
      const s = normalizedStatus(r.dealStatus)
      countByStatus[s] = (countByStatus[s] ?? 0) + 1
    })

    const stageCounts: number[] = []
    for (let i = 0; i < FUNNEL_STAGES.length; i++) {
      const stage = FUNNEL_STAGES[i]
      if (stage.key === 'visitas') {
        stageCounts.push(visitasSum)
      } else if (stage.key === 'lead') {
        stageCounts.push(leadSum)
      } else if (stage.statuses === null) {
        stageCounts.push(totalReunioes)
      } else {
        const count = stage.statuses.reduce((sum, st) => sum + (countByStatus[st] ?? 0), 0)
        stageCounts.push(count)
      }
    }

    const topOfFunnel = visitasSum
    const stagesWithConversion = FUNNEL_STAGES.map((stage, i) => {
      const count = stageCounts[i]
      const prevCount = i === 0 ? topOfFunnel : stageCounts[i - 1]
      const conversionFromPrevious =
        prevCount > 0 ? Math.round((count / prevCount) * 1000) / 10 : null
      const conversionFromLeads = topOfFunnel > 0 ? Math.round((count / topOfFunnel) * 1000) / 10 : null
      return {
        key: stage.key,
        label: stage.label,
        description: stage.description,
        count,
        conversionFromPrevious,
        conversionFromLeads,
      }
    })

    return NextResponse.json({
      total: totalReunioes,
      leadSum,
      visitasSum,
      stages: stagesWithConversion,
    })
  } catch (error: any) {
    console.error('Erro ao buscar funil:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar funil', details: error.message },
      { status: 500 }
    )
  }
}
