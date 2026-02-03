import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const KEY_GERACAO_LEAD = 'geracaoLead_entries'

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

async function getLeadAndVisitasFromGeracao(
  startDate: string | null,
  endDate: string | null
): Promise<{ leadSum: number; visitasSum: number; leadWeeksCount: number }> {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: KEY_GERACAO_LEAD },
    })
    if (!row?.value) return { leadSum: 0, visitasSum: 0, leadWeeksCount: 0 }
    const parsed = JSON.parse(row.value)
    if (!Array.isArray(parsed)) return { leadSum: 0, visitasSum: 0, leadWeeksCount: 0 }
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
    let leadWeeksCount = 0
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
      leadWeeksCount += 1
    }
    return { leadSum, visitasSum, leadWeeksCount }
  } catch {
    return { leadSum: 0, visitasSum: 0, leadWeeksCount: 0 }
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const closerId = searchParams.get('closerId')
    const clientId = searchParams.get('clientId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (closerId) {
      where.closerId = closerId
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Buscar todos os relatórios
    const reports = await prisma.report.findMany({
      where: {
        meeting: where,
      },
      include: {
        meeting: {
          include: {
            closer: true,
            client: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calcular média geral por closer
    const closerStats: Record<string, { scores: number[]; count: number }> = {}
    reports.forEach((report) => {
      const closerName = report.meeting.closer.name
      if (!closerStats[closerName]) {
        closerStats[closerName] = { scores: [], count: 0 }
      }
      closerStats[closerName].scores.push(report.overallScore)
      closerStats[closerName].count++
    })

    const closerAverages = Object.entries(closerStats).map(([name, stats]) => ({
      name: name || 'N/A',
      average: stats.scores && stats.scores.length > 0
        ? stats.scores.reduce((a: number, b: number) => (a || 0) + (b || 0), 0) / stats.scores.length
        : 0,
      count: stats.count || 0,
    }))

    // Ranking
    const ranking = closerAverages.sort((a, b) => b.average - a.average)

    // Evolução mensal (usar data da reunião, não data do relatório)
    const monthlyData: Record<string, { scores: number[]; count: number }> = {}
    reports.forEach((report) => {
      // Usar meeting.createdAt (data da call) em vez de report.createdAt
      const meetingDate = report.meeting?.createdAt || report.createdAt
      const month = meetingDate.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { scores: [], count: 0 }
      }
      monthlyData[month].scores.push(report.overallScore)
      monthlyData[month].count++
    })

    const monthlyEvolution = Object.entries(monthlyData)
      .map(([month, stats]) => ({
        month: month || 'N/A',
        average: stats.scores && stats.scores.length > 0
          ? stats.scores.reduce((a: number, b: number) => (a || 0) + (b || 0), 0) / stats.scores.length
          : 0,
        count: stats.count || 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const now = new Date()
    const closerNamesInRanking = ranking.map((r) => r.name)

    // Reuniões por semana: últimas 52 semanas (intervalo de 1 ano a partir de hoje)
    const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
    const getMonday = (d: Date): Date => {
      const date = new Date(d)
      date.setHours(0, 0, 0, 0)
      const day = date.getDay()
      const diff = day === 0 ? -6 : 1 - day // Segunda = 1
      date.setDate(date.getDate() + diff)
      return date
    }
    const thisMonday = getMonday(now)
    const firstMonday = new Date(thisMonday.getTime() - 52 * MS_PER_WEEK)
    const weekCounts: number[] = Array(52).fill(0)
    reports.forEach((report) => {
      const meetingDate = report.meeting?.createdAt || report.createdAt
      const d = new Date(meetingDate)
      d.setHours(0, 0, 0, 0)
      const weekIndex = Math.floor((d.getTime() - firstMonday.getTime()) / MS_PER_WEEK)
      if (weekIndex >= 0 && weekIndex < 52) {
        weekCounts[weekIndex]++
      }
    })
    const meetingsPerWeek = weekCounts.map((count, i) => {
      const weekStart = new Date(firstMonday.getTime() + i * MS_PER_WEEK)
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
      const labelStart = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const labelEnd = weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      return {
        week: `S${i + 1}`,
        weekLabel: `${labelStart} - ${labelEnd}`,
        count,
      }
    })

    // Média por closer por semana (últimas 52 semanas) para gráfico de linhas
    const closerByWeek: Record<number, Record<string, number[]>> = {}
    reports.forEach((report) => {
      const meetingDate = report.meeting?.createdAt || report.createdAt
      const d = new Date(meetingDate)
      d.setHours(0, 0, 0, 0)
      const weekIndex = Math.floor((d.getTime() - firstMonday.getTime()) / MS_PER_WEEK)
      if (weekIndex < 0 || weekIndex >= 52) return
      const closerName = report.meeting?.closer?.name || 'N/A'
      if (!closerByWeek[weekIndex]) closerByWeek[weekIndex] = {}
      if (!closerByWeek[weekIndex][closerName]) closerByWeek[weekIndex][closerName] = []
      closerByWeek[weekIndex][closerName].push(report.overallScore)
    })
    const rankingWeeklyEvolution = meetingsPerWeek.map((weekItem, i) => {
      const row: Record<string, string | number | null> = { week: weekItem.weekLabel }
      closerNamesInRanking.forEach((name) => {
        const scores = closerByWeek[i]?.[name]
        row[name] =
          scores && scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : null
      })
      return row
    })

    // Função para normalizar nomes de critérios (remove espaços extras, converte para minúsculas para comparação)
    // Isso garante que critérios com nomes similares (diferenças de espaços, maiúsculas/minúsculas) sejam agrupados
    const normalizeCriterionName = (name: string): string => {
      if (!name) return ''
      // Remove espaços extras, converte para minúsculas, remove acentos e caracteres especiais
      return name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
        .trim()
    }
    
    // Função para extrair a parte principal do critério (antes dos parênteses)
    // Ex: "Clareza comercial e proposta de valor (ROI, packaging, escopo)" -> "Clareza comercial e proposta de valor"
    const getCriterionBaseName = (name: string): string => {
      if (!name) return ''
      const match = name.match(/^([^(]+)/)
      return match ? match[1].trim() : name.trim()
    }
    
    // Função para obter chave única do critério (prioriza ID, depois base do nome normalizado)
    const getCriterionKey = (c: any): string => {
      // Se tiver ID válido, usar ID (mais confiável)
      if (c.id && typeof c.id === 'string' && !c.id.startsWith('temp-')) {
        return `id:${c.id}`
      }
      // Caso contrário, usar base do nome normalizado (parte antes dos parênteses)
      // Isso agrupa critérios como:
      // "Clareza comercial (ROI, packaging, escopo)" e "Clareza comercial (ROI, packaging, investimento)"
      const baseName = getCriterionBaseName(c.name || '')
      return `name:${normalizeCriterionName(baseName)}`
    }

    // Distribuição por critério (usar mesma normalização)
    const criteriaDistribution: Record<string, { scores: number[]; count: number; originalName: string; originalId?: string }> = {}
    
    reports.forEach((report) => {
      try {
        const criteria = JSON.parse(report.criteriaScores)
        if (Array.isArray(criteria)) {
          criteria.forEach((c: any) => {
            if (c && c.name && c.score_0_10 != null) {
              const key = getCriterionKey(c)
              const original = c.name.trim()
              
              if (!criteriaDistribution[key]) {
                criteriaDistribution[key] = { 
                  scores: [], 
                  count: 0, 
                  originalName: original,
                  originalId: c.id
                }
              }
              criteriaDistribution[key].scores.push(c.score_0_10)
              criteriaDistribution[key].count++
            }
          })
        }
      } catch (e) {
        console.error('Erro ao processar critérios:', e)
      }
    })

    const criteriaAverages = Object.entries(criteriaDistribution)
      .map(([key, stats]) => ({
        name: stats.originalName || key || 'N/A',
        average: stats.scores && stats.scores.length > 0
          ? stats.scores.reduce((a: number, b: number) => (a || 0) + (b || 0), 0) / stats.scores.length
          : 0,
        count: stats.count || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)) // Ordenar por nome

    // Mapa para armazenar informações de cada critério único (usando chave única)
    // Também manter contagem de ocorrências para escolher o nome mais comum
    const criterionMap = new Map<string, { 
      originalName: string
      originalId?: string
      count: number
      allNames: Set<string>
    }>()

    // Heatmap data (closer x critério)
    // Primeiro, coletar todos os critérios únicos de todos os relatórios
    // Usar chave única (ID ou base do nome normalizado) como chave, mas manter o nome original para exibição
    reports.forEach((report) => {
      try {
        const criteria = JSON.parse(report.criteriaScores)
        if (Array.isArray(criteria)) {
          criteria.forEach((c: any) => {
            if (c && c.name) {
              const key = getCriterionKey(c)
              const original = c.name.trim()
              
              if (!criterionMap.has(key)) {
                criterionMap.set(key, { 
                  originalName: original,
                  originalId: c.id,
                  count: 1,
                  allNames: new Set([original])
                })
              } else {
                const existing = criterionMap.get(key)!
                existing.count++
                existing.allNames.add(original)
                // Escolher o nome mais curto (geralmente mais genérico, sem detalhes entre parênteses)
                // Isso garante que critérios como:
                // "Clareza comercial (ROI, packaging, escopo)" e "Clareza comercial (ROI, packaging, investimento)"
                // sejam exibidos como "Clareza comercial" (se existir) ou o mais curto disponível
                const baseOriginal = getCriterionBaseName(original)
                const baseExisting = getCriterionBaseName(existing.originalName)
                
                // Preferir o nome que é exatamente a base (sem parênteses) ou o mais curto
                if (original === baseOriginal && existing.originalName !== baseExisting) {
                  existing.originalName = original
                } else if (original.length < existing.originalName.length && 
                           baseOriginal === baseExisting) {
                  existing.originalName = original
                }
              }
            }
          })
        }
      } catch (e) {
        console.error('Erro ao coletar critérios:', e)
      }
    })

    // Agora processar os dados do heatmap garantindo que todos os closers tenham todos os critérios
    const heatmapData: Record<string, Record<string, number[]>> = {}
    reports.forEach((report) => {
      try {
        const closerName = report.meeting?.closer?.name || 'N/A'
        if (!heatmapData[closerName]) {
          heatmapData[closerName] = {}
          // Inicializar todos os critérios para este closer usando chaves únicas
          criterionMap.forEach((info, key) => {
            heatmapData[closerName][key] = []
          })
        }
        const criteria = JSON.parse(report.criteriaScores)
        if (Array.isArray(criteria)) {
          criteria.forEach((c: any) => {
            if (c && c.name && c.score_0_10 != null) {
              const key = getCriterionKey(c)
              // Usar chave única para agrupar corretamente
              if (!heatmapData[closerName][key]) {
                heatmapData[closerName][key] = []
              }
              heatmapData[closerName][key].push(c.score_0_10)
            }
          })
        }
      } catch (e) {
        console.error('Erro ao processar heatmap:', e)
      }
    })

    // Garantir que todos os closers tenham todos os critérios (mesmo que vazios)
    // Ordenar pelos nomes originais para exibição
    const sortedCriteriaEntries = Array.from(criterionMap.entries())
      .sort((a, b) => a[1].originalName.localeCompare(b[1].originalName)) // Ordenar pelo nome original
    
    const heatmap = Object.entries(heatmapData).map(([closer, criteria]) => ({
      closer: closer || 'N/A',
      criteria: sortedCriteriaEntries.map(([key, info]) => {
        const scores = criteria[key] || []
        return {
          criterion: info.originalName, // Usar nome original para exibição
          average: scores && scores.length > 0 
            ? scores.reduce((a: number, b: number) => (a || 0) + (b || 0), 0) / scores.length 
            : 0,
        }
      }),
    }))

    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Heatmap processado:', {
        totalClosers: heatmap.length,
        totalCriteria: sortedCriteriaEntries.length,
        criteriaNames: sortedCriteriaEntries.map(([_, info]) => info.originalName),
        criteriaKeys: Array.from(criterionMap.keys()),
        criteriaDetails: Array.from(criterionMap.entries()).map(([key, info]) => ({
          key,
          name: info.originalName,
          count: info.count,
          allVariations: Array.from(info.allNames)
        })),
        sampleRow: heatmap[0],
      })
      console.log('📊 Distribuição por Critério:', {
        totalCriteria: criteriaAverages.length,
        criteriaNames: criteriaAverages.map(c => c.name),
      })
    }

    // Calcular métricas adicionais
    const allScores = reports.map((r) => r.overallScore).filter((s) => s != null)
    const maxScore = allScores.length > 0 ? Math.max(...allScores) : 0

    // Nota média das últimas 5 reuniões (por data da reunião)
    const reportsByMeetingDate = [...reports].sort(
      (a, b) => (b.meeting?.createdAt?.getTime() ?? 0) - (a.meeting?.createdAt?.getTime() ?? 0)
    )
    const last5Scores = reportsByMeetingDate.slice(0, 5).map((r) => r.overallScore).filter((s) => s != null)
    const averageLast5Meetings =
      last5Scores.length > 0
        ? last5Scores.reduce((a, b) => a + b, 0) / last5Scores.length
        : null
    
    // Calcular desvio padrão
    let standardDeviation = 0
    if (allScores.length > 0) {
      const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length
      const variance = allScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / allScores.length
      standardDeviation = Math.sqrt(variance)
    }

    // Indicadores por status (dealStatus do Report) — ordem do processo: contato até fechamento
    const STATUS_ORDER = [
      'Agendar visita comercial',
      'Aguardando documentos',
      'Fazer proposta',
      'Proposta enviado',
      'Negociação',
      'Parceria',
      'Possível parceria',
      'Follow-up',
      'Fechado',
      'Perdido',
      'Sem interesse',
      'Sem retorno',
      'Outros',
    ]
    const statusCounts: Record<string, number> = {}
    STATUS_ORDER.forEach((s) => { statusCounts[s] = 0 })
    reports.forEach((r) => {
      const status = r.dealStatus?.trim() && STATUS_ORDER.includes(r.dealStatus!) ? r.dealStatus! : 'Outros'
      statusCounts[status] = (statusCounts[status] ?? 0) + 1
    })
    const statusIndicators = STATUS_ORDER.map((status) => ({
      status,
      count: statusCounts[status] ?? 0,
    }))

    const totalPropostaEnviadoENegociacao =
      (statusCounts['Proposta enviado'] ?? 0) + (statusCounts['Negociação'] ?? 0)

    const totalOportunidadesGeradas =
      (statusCounts['Aguardando documentos'] ?? 0) +
      (statusCounts['Fazer proposta'] ?? 0) +
      (statusCounts['Proposta enviado'] ?? 0) +
      (statusCounts['Negociação'] ?? 0) +
      (statusCounts['Parceria'] ?? 0)

    const totalFechado = statusCounts['Fechado'] ?? 0
    const totalPropostaEnviado = statusCounts['Proposta enviado'] ?? 0

    const META_KEYS_STATS = [
      'metaReunioesSemanaGeral',
      'metaReunioesSemanaPorCloser',
      'metaNotaCloser',
      'metaVendas',
      'metaLeadPorSemana',
      'metaGeracaoOportunidade',
      'metaEnvioProposta',
      'metaConversao',
    ] as const
    const defaultMetas = {
      metaReunioesSemanaGeral: 21,
      metaReunioesSemanaPorCloser: 5,
      metaNotaCloser: 70,
      metaVendas: 0,
      metaLeadPorSemana: 60,
      metaGeracaoOportunidade: 75,
      metaEnvioProposta: 50,
      metaConversao: 15,
    }
    let metas = { ...defaultMetas }
    try {
      const rows = await prisma.appSetting.findMany({
        where: { key: { in: [...META_KEYS_STATS] } },
      })
      const map = new Map(rows.map((r) => [r.key, r.value]))
      META_KEYS_STATS.forEach((key) => {
        metas[key] = Number(map.get(key) ?? defaultMetas[key])
      })
    } catch (_) {
      // Tabela pode não existir ainda; usar defaults
    }

    // Período coberto pelos dados (para meta de reuniões proporcional)
    let periodStart: Date
    let periodEnd: Date
    if (startDate && endDate) {
      periodStart = new Date(startDate)
      periodStart.setHours(0, 0, 0, 0)
      periodEnd = new Date(endDate)
      periodEnd.setHours(23, 59, 59, 999)
    } else if (reports.length > 0) {
      const dates = reports.map((r) => (r.meeting?.createdAt || r.createdAt).getTime())
      periodStart = new Date(Math.min(...dates))
      periodStart.setHours(0, 0, 0, 0)
      periodEnd = new Date(Math.max(...dates))
      periodEnd.setHours(23, 59, 59, 999)
    } else {
      const now = new Date()
      periodEnd = now
      periodEnd.setHours(23, 59, 59, 999)
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      periodStart.setHours(0, 0, 0, 0)
    }
    const periodDays = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)))

    const { leadSum, leadWeeksCount } = await getLeadAndVisitasFromGeracao(
      startDate || periodStart.toISOString().slice(0, 10),
      endDate || periodEnd.toISOString().slice(0, 10)
    )

    return NextResponse.json({
      closerAverages,
      ranking,
      monthlyEvolution,
      rankingWeeklyEvolution,
      rankingCloserNames: closerNamesInRanking,
      meetingsPerWeek,
      criteriaAverages,
      heatmap,
      totalReports: reports.length,
      maxScore,
      standardDeviation,
      averageLast5Meetings,
      statusIndicators,
      totalPropostaEnviadoENegociacao,
      totalOportunidadesGeradas,
      totalFechado,
      totalPropostaEnviado,
      metas,
      periodDays,
      leadSum,
      leadWeeksCount,
    })
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas', details: error.message },
      { status: 500 }
    )
  }
}