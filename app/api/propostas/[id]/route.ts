import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        meeting: {
          include: {
            client: true,
            closer: true,
            report: true,
          },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      proposal,
    })
  } catch (error: any) {
    console.error('Erro ao buscar proposta:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar proposta', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      )
    }

    // Deletar proposta (steps serão deletados em cascade devido ao onDelete: Cascade)
    await prisma.proposal.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Proposta excluída com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao deletar proposta:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar proposta', details: error.message },
      { status: 500 }
    )
  }
}
