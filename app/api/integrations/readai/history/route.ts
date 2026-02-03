import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Histórico de importações
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }

    const imports = await prisma.readAiImport.findMany({
      where,
      include: {
        integration: {
          select: {
            id: true,
            enabled: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      imports: imports.map((imp) => ({
        id: imp.id,
        readAiMeetingId: imp.readAiMeetingId,
        meetingId: imp.meetingId,
        status: imp.status,
        errorMessage: imp.errorMessage,
        createdAt: imp.createdAt,
        updatedAt: imp.updatedAt,
      })),
      total: imports.length,
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar histórico:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar histórico', details: error.message },
      { status: 500 }
    )
  }
}
