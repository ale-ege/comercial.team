import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        meeting: {
          include: {
            client: true,
            closer: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      )
    }

    // Parsear rawModelOutput (que é uma string JSON)
    let rawModelOutputParsed = null
    try {
      rawModelOutputParsed = JSON.parse(report.rawModelOutput)
    } catch (e) {
      console.error('Erro ao parsear rawModelOutput:', e)
      rawModelOutputParsed = {}
    }

    // Extrair chart_data e metadata do rawModelOutput se existirem
    const chartData = rawModelOutputParsed?.chart_data || null
    const metadata = rawModelOutputParsed?.metadata || null

    return NextResponse.json({
      id: report.id,
      meetingId: report.meetingId,
      overallScore: report.overallScore,
      criteria: JSON.parse(report.criteriaScores),
      insights: JSON.parse(report.insights),
      rawModelOutput: rawModelOutputParsed,
      chart_data: chartData,
      metadata: metadata,
      meeting: {
        id: report.meeting.id,
        transcript: report.meeting.transcript,
        fileName: report.meeting.fileName,
        client: report.meeting.client,
        closer: report.meeting.closer,
        createdAt: report.meeting.createdAt,
      },
      createdAt: report.createdAt,
    })
  } catch (error: any) {
    console.error('Erro ao buscar relatório:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar relatório', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Buscar o report para obter o meetingId
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      select: { meetingId: true },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      )
    }

    // Deletar o meeting (isso deleta o report automaticamente devido ao onDelete: Cascade)
    await prisma.meeting.delete({
      where: { id: report.meetingId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar relatório:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar relatório', details: error.message },
      { status: 500 }
    )
  }
}

const DEAL_STATUS_VALUES = [
  'Fechado',
  'Perdido',
  'Agendar visita comercial',
  'Aguardando documentos',
  'Fazer proposta',
  'Proposta enviado',
  'Negociação',
  'Parceria',
  'Possível parceria',
  'Follow-up',
  'Sem interesse',
  'Sem retorno',
  'Outros',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { dealStatus } = body as { dealStatus?: string }

    if (dealStatus !== undefined) {
      if (typeof dealStatus !== 'string' || !DEAL_STATUS_VALUES.includes(dealStatus)) {
        return NextResponse.json(
          { error: 'Status inválido. Valores: ' + DEAL_STATUS_VALUES.join(', ') },
          { status: 400 }
        )
      }
    }

    const report = await prisma.report.update({
      where: { id: params.id },
      data: { dealStatus: dealStatus ?? null },
    })

    return NextResponse.json({ success: true, dealStatus: report.dealStatus })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 })
    }
    console.error('Erro ao atualizar relatório:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar relatório', details: error.message },
      { status: 500 }
    )
  }
}