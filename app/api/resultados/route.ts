import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const company = searchParams.get('company')?.trim() || ''
    const closerId = searchParams.get('closerId')?.trim() || ''
    const dealStatus = searchParams.get('dealStatus')?.trim() || ''

    // Filtro por closer no banco; empresa e status são filtrados em memória
    const whereMeeting: { closerId?: string } = {}
    if (closerId) {
      whereMeeting.closerId = closerId
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
