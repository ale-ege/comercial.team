import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, getISOWeek, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const KEY_ENTRIES = 'geracaoLead_entries'

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

export async function GET(request: NextRequest) {
  try {
    // Buscar dados de visitas e leads do AppSetting
    let leadData: Record<string, { visitas: number; leads: number }> = {}
    
    if (typeof (prisma as any).appSetting !== 'undefined') {
      const row = await prisma.appSetting.findUnique({
        where: { key: KEY_ENTRIES },
      })
      
      if (row?.value) {
        try {
          const parsed = JSON.parse(row.value)
          if (Array.isArray(parsed)) {
            parsed.forEach((e: any) => {
              if (e?.weekId && typeof e.total === 'number' && typeof e.visitas === 'number') {
                leadData[e.weekId] = {
                  visitas: Math.max(0, Number(e.visitas) || 0),
                  leads: Math.max(0, Number(e.total) || 0),
                }
              }
            })
          }
        } catch (_) {}
      }
    }

    // Buscar agendamentos (reuniões) dos últimos 3 meses (12 semanas)
    const today = new Date()
    const thisMonday = getMonday(today)
    const weeksAgo12 = subWeeks(thisMonday, 11)
    
    // Buscar todas as reuniões no período
    const meetings = await prisma.meeting.findMany({
      where: {
        createdAt: {
          gte: weeksAgo12,
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Agrupar reuniões por semana
    const meetingsByWeek: Record<string, number> = {}
    meetings.forEach((meeting) => {
      const monday = getMonday(meeting.createdAt)
      const weekId = getWeekId(monday)
      meetingsByWeek[weekId] = (meetingsByWeek[weekId] || 0) + 1
    })

    // Gerar dados dos últimos 3 meses (12 semanas)
    const weeksData: Array<{
      weekId: string
      label: string
      visitas: number
      leads: number
      agendamentos: number
      percentLeadVisitas: number
      percentReuniaoLeads: number
    }> = []

    for (let i = 11; i >= 0; i--) {
      const monday = subWeeks(thisMonday, i)
      const weekId = getWeekId(monday)
      const label = weekIdToLabel(weekId)
      
      const visitas = leadData[weekId]?.visitas || 0
      const leads = leadData[weekId]?.leads || 0
      const agendamentos = meetingsByWeek[weekId] || 0
      
      const percentLeadVisitas = visitas > 0 ? (leads / visitas) * 100 : 0
      const percentReuniaoLeads = leads > 0 ? (agendamentos / leads) * 100 : 0

      weeksData.push({
        weekId,
        label,
        visitas,
        leads,
        agendamentos,
        percentLeadVisitas: Math.round(percentLeadVisitas * 100) / 100,
        percentReuniaoLeads: Math.round(percentReuniaoLeads * 100) / 100,
      })
    }

    return NextResponse.json({ weeks: weeksData })
  } catch (error: any) {
    console.error('Erro ao buscar indicadores de geração de lead:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar indicadores', details: error.message },
      { status: 500 }
    )
  }
}
