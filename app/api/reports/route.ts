import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    const reports = await prisma.report.findMany({
      where: {
        meeting: where,
      },
      include: {
        meeting: {
          include: {
            client: true,
            closer: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedReports = reports.map((report) => ({
      id: report.id,
      meetingId: report.meetingId,
      overallScore: report.overallScore,
      criteria: JSON.parse(report.criteriaScores),
      insights: JSON.parse(report.insights),
      client: report.meeting.client,
      closer: report.meeting.closer,
      createdAt: report.createdAt,
    }))

    return NextResponse.json({ reports: formattedReports })
  } catch (error: any) {
    console.error('Erro ao buscar relatórios:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar relatórios', details: error.message },
      { status: 500 }
    )
  }
}