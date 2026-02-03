import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, getISOWeek, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const KEY_ENTRIES = 'geracaoLead_entries'

function appSettingUnavailable(): NextResponse | null {
  if (typeof (prisma as any).appSetting === 'undefined') {
    return NextResponse.json(
      {
        error: 'Modelo AppSetting não encontrado no Prisma.',
        details: 'Execute no terminal: npx prisma generate. Depois reinicie o servidor (npm run dev).',
      },
      { status: 503 }
    )
  }
  return null
}
const NUM_AVAILABLE_WEEKS = 104

/** Retorna a segunda-feira da semana da data */
function getMonday(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

/** Gera o ID da semana no formato YYYY-Www */
function getWeekId(monday: Date): string {
  const y = format(monday, 'yyyy')
  const w = String(getISOWeek(monday)).padStart(2, '0')
  return `${y}-W${w}`
}

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
  return monday
}

/** Retorna o label da semana (início - fim) a partir do weekId */
function weekIdToLabel(weekId: string): string {
  const monday = weekIdToMonday(weekId)
  if (!monday) return weekId
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${format(monday, 'dd/MM/yyyy', { locale: ptBR })} - ${format(sunday, 'dd/MM/yyyy', { locale: ptBR })}`
}

/** Lista as últimas N semanas para o dropdown (weekId + label) */
function listAvailableWeeks(count: number): { weekId: string; label: string }[] {
  const today = new Date()
  const thisMonday = getMonday(today)
  const weeks: { weekId: string; label: string }[] = []
  for (let i = count - 1; i >= 0; i--) {
    const monday = subWeeks(thisMonday, i)
    const weekId = getWeekId(monday)
    weeks.push({ weekId, label: weekIdToLabel(weekId) })
  }
  return weeks
}

export async function GET() {
  const unavailable = appSettingUnavailable()
  if (unavailable) return unavailable
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: KEY_ENTRIES },
    })
    let entries: { weekId: string; total: number; visitas: number }[] = []
    if (row?.value) {
      try {
        const parsed = JSON.parse(row.value)
        if (Array.isArray(parsed)) {
          entries = parsed.filter(
            (e: any) => e && typeof e.weekId === 'string' && (typeof e.total === 'number' || typeof e.total === 'string')
          ).map((e: any) => ({
            weekId: e.weekId,
            total: Number(e.total) || 0,
            visitas: Math.max(0, Number(e.visitas) || 0),
          }))
        }
      } catch (_) {}
    }

    const entriesWithLabel = entries.map((e) => ({
      weekId: e.weekId,
      label: weekIdToLabel(e.weekId),
      total: e.total,
      visitas: e.visitas,
    }))

    const availableWeeks = listAvailableWeeks(NUM_AVAILABLE_WEEKS)

    return NextResponse.json({
      entries: entriesWithLabel,
      availableWeeks,
    })
  } catch (error: any) {
    console.error('Erro ao buscar geração de lead:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar geração de lead', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const unavailable = appSettingUnavailable()
  if (unavailable) return unavailable
  try {
    let body: any
    try {
      body = await request.json()
    } catch (_) {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido (JSON esperado)' },
        { status: 400 }
      )
    }
    const entries = body?.entries
    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Envie um objeto com array entries: { weekId, total, visitas? }' },
        { status: 400 }
      )
    }

    const normalized = entries
      .filter((e: any) => e != null && typeof e.weekId === 'string' && String(e.weekId).trim() !== '')
      .map((e: any) => ({
        weekId: String(e.weekId).trim(),
        total: Math.max(0, typeof e.total === 'number' ? e.total : Number(e.total) || 0),
        visitas: Math.max(0, typeof e.visitas === 'number' ? e.visitas : Number(e.visitas) || 0),
      }))

    const value = JSON.stringify(normalized)
    if (value.length > 1_000_000) {
      return NextResponse.json(
        { error: 'Dados muito grandes para salvar' },
        { status: 400 }
      )
    }

    await prisma.appSetting.upsert({
      where: { key: KEY_ENTRIES },
      create: { key: KEY_ENTRIES, value },
      update: { value },
    })

    const entriesWithLabel = normalized.map((e: { weekId: string; total: number; visitas: number }) => ({
      weekId: e.weekId,
      label: weekIdToLabel(e.weekId),
      total: e.total,
      visitas: e.visitas,
    }))

    return NextResponse.json({ entries: entriesWithLabel })
  } catch (error: any) {
    console.error('Erro ao salvar geração de lead:', error)
    const message = error?.message ?? String(error)
    const code = error?.code ?? error?.meta?.cause
    return NextResponse.json(
      {
        error: 'Erro ao salvar geração de lead',
        details: message,
        ...(code && { code }),
      },
      { status: 500 }
    )
  }
}
