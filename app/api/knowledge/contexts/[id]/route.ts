import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateContextSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['global', 'client', 'project']).optional(),
  instructions: z.string().optional().nullable(),
  tone: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await prisma.knowledgeContext.findUnique({
      where: { id: params.id },
      include: {
        documents: {
          include: {
            document: true,
          },
        },
      },
    })

    if (!context) {
      return NextResponse.json(
        { error: 'Contexto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      context: {
        ...context,
        tags: context.tags ? JSON.parse(context.tags) : [],
        documentCount: context.documents.length,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar contexto:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contexto', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateContextSchema.parse(body)

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.instructions !== undefined) updateData.instructions = data.instructions
    if (data.tone !== undefined) updateData.tone = data.tone
    if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null
    if (data.active !== undefined) updateData.active = data.active

    const context = await prisma.knowledgeContext.update({
      where: { id: params.id },
      data: updateData,
      include: {
        documents: {
          include: {
            document: true,
          },
        },
      },
    })

    return NextResponse.json({
      context: {
        ...context,
        tags: context.tags ? JSON.parse(context.tags) : [],
        documentCount: context.documents.length,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao atualizar contexto:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Erro de validação',
          details: error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Contexto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar contexto', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.knowledgeContext.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Erro ao deletar contexto:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Contexto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao deletar contexto', details: error.message },
      { status: 500 }
    )
  }
}
