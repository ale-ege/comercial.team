import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const company = searchParams.get('company')?.trim() || ''
    const closerId = searchParams.get('closerId')?.trim() || ''
    const dealStatus = searchParams.get('dealStatus')?.trim() || ''
    const yearParam = searchParams.get('year')?.trim() || ''
    const monthParam = searchParams.get('month')?.trim() || ''

    // Filtro por closer e período no banco; empresa e status são filtrados em memória
    const whereMeeting: {
      closerId?: string
      createdAt?: { gte: Date; lte: Date }
    } = {}
    if (closerId) {
      whereMeeting.closerId = closerId
    }

    const year = yearParam ? parseInt(yearParam, 10) : NaN
    if (!Number.isNaN(year) && year >= 1900 && year <= 2100) {
      const month = monthParam ? parseInt(monthParam, 10) : NaN
      const hasMonth = !Number.isNaN(month) && month >= 1 && month <= 12
      if (hasMonth) {
        const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
        const end = new Date(year, month, 0, 23, 59, 59, 999)
        whereMeeting.createdAt = { gte: start, lte: end }
      } else {
        const start = new Date(year, 0, 1, 0, 0, 0, 0)
        const end = new Date(year, 11, 31, 23, 59, 59, 999)
        whereMeeting.createdAt = { gte: start, lte: end }
      }
    }

    const meetings = await prisma.meeting.findMany({
      where: Object.keys(whereMeeting).length > 0 ? whereMeeting : undefined,
      include: {
        client: true,
        closer: true,
        report: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const companyLower = company.toLowerCase()
    const matchesSearch = (m: { client: { name: string; company: string | null } }) => {
      if (!companyLower) return true
      const nameMatch = m.client.name?.toLowerCase().includes(companyLower)
      const companyMatch =
        m.client.company != null &&
        m.client.company.toLowerCase().includes(companyLower)
      return Boolean(nameMatch || companyMatch)
    }

    // Apenas meetings que têm report e (opcionalmente) batem com os filtros
    let resultados = meetings
      .filter((m) => m.report != null && matchesSearch(m))
      .map((meeting) => ({
        id: meeting.report!.id,
        meetingId: meeting.id,
        closer: {
          id: meeting.closer.id,
          name: meeting.closer.name,
        },
        client: {
          id: meeting.client.id,
          name: meeting.client.name,
          company: meeting.client.company,
        },
        fileName: meeting.fileName || null,
        overallScore: meeting.report!.overallScore,
        dealStatus: meeting.report!.dealStatus ?? 'Outros',
        createdAt: meeting.createdAt.toISOString(),
      }))

    if (dealStatus) {
      resultados = resultados.filter((r) => r.dealStatus === dealStatus)
    }

    return NextResponse.json({ resultados })
  } catch (error: any) {
    console.error('❌ Erro ao buscar resultados:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
    })
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar resultados', 
        details: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        }),
      },
      { status: 500 }
    )
  }
}
