import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createProposalSchema = z.object({
  meetingId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { meetingId } = createProposalSchema.parse(body)

    // Verificar se já existe proposta para este meeting
    const existing = await prisma.proposal.findUnique({
      where: { meetingId },
      include: {
        meeting: {
          include: {
            client: true,
            closer: true,
          },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        proposal: existing,
      })
    }

    // Buscar meeting para obter clientId e closerId
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        client: true,
        closer: true,
      },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting não encontrado' },
        { status: 404 }
      )
    }

    // Criar proposta
    const proposal = await prisma.proposal.create({
      data: {
        meetingId,
        clientId: meeting.clientId,
        closerId: meeting.closerId,
        status: 'draft',
      },
      include: {
        meeting: {
          include: {
            client: true,
            closer: true,
          },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      proposal,
    })
  } catch (error: any) {
    console.error('Erro ao criar/buscar proposta:', error)
    console.error('Stack trace:', error.stack)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    
    // Verificar se é erro do Prisma relacionado a schema não sincronizado
    if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
      return NextResponse.json(
        { 
          error: 'Erro ao criar proposta', 
          details: 'O banco de dados precisa ser atualizado. Execute: npx prisma db push',
          code: error.code,
        },
        { status: 500 }
      )
    }
    
    if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
      return NextResponse.json(
        { 
          error: 'Erro ao criar proposta', 
          details: 'Já existe uma proposta para este meeting',
          code: error.code,
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao criar proposta', 
        details: error.message || 'Erro desconhecido',
        code: error.code,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const meetingId = searchParams.get('meetingId')

    // Se meetingId fornecido, retornar proposta específica
    if (meetingId) {
      const proposal = await prisma.proposal.findUnique({
        where: { meetingId },
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
    }

    // Se não há meetingId, listar todas as propostas
    const proposals = await prisma.proposal.findMany({
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
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      proposals,
    })
  } catch (error: any) {
    console.error('Erro ao buscar proposta(s):', error)
    return NextResponse.json(
      { error: 'Erro ao buscar proposta(s)', details: error.message },
      { status: 500 }
    )
  }
}
