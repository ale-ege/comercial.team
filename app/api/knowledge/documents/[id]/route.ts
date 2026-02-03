import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  source: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  contextIds: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: params.id },
      include: {
        contexts: {
          include: {
            context: true,
          },
        },
        chunks: true,
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      document: {
        ...document,
        tags: document.tags ? JSON.parse(document.tags) : [],
        metadata: document.metadata ? JSON.parse(document.metadata) : null,
        contextIds: document.contexts.map((dc) => dc.contextId),
        chunkCount: document.chunks.length,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar documento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar documento', details: error.message },
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
    const data = updateDocumentSchema.parse(body)

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.source !== undefined) updateData.source = data.source
    if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null

    await prisma.knowledgeDocument.update({
      where: { id: params.id },
      data: updateData,
    })

    // Atualizar contextos se fornecido
    if (data.contextIds !== undefined) {
      // Remover associações existentes
      await prisma.documentContext.deleteMany({
        where: { documentId: params.id },
      })

      // Criar novas associações
      if (data.contextIds.length > 0) {
        // Criar associações uma por uma para evitar duplicatas
        for (const contextId of data.contextIds) {
          try {
            await prisma.documentContext.create({
              data: {
                documentId: params.id,
                contextId,
              },
            })
          } catch (error: any) {
            // Se já existe, ignorar (código P2002 é unique constraint violation)
            if (error.code !== 'P2002') {
              throw error
            }
          }
        }
      }
    }

    // Buscar documento atualizado
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: params.id },
      include: {
        contexts: {
          include: {
            context: true,
          },
        },
        chunks: true,
      },
    })

    return NextResponse.json({
      document: {
        ...document,
        tags: document?.tags ? JSON.parse(document.tags) : [],
        metadata: document?.metadata ? JSON.parse(document.metadata) : null,
        contextIds: document?.contexts.map((dc) => dc.contextId) || [],
        chunkCount: document?.chunks.length || 0,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao atualizar documento:', error)
    
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
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar documento', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Buscar documento para deletar arquivo se existir
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: params.id },
    })

    if (document?.filePath) {
      try {
        const fs = await import('fs/promises')
        await fs.unlink(document.filePath)
      } catch (fileError) {
        console.warn('⚠️ Erro ao deletar arquivo:', fileError)
        // Continuar mesmo se não conseguir deletar o arquivo
      }
    }

    // Deletar documento (chunks e contextos serão deletados em cascade)
    await prisma.knowledgeDocument.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Erro ao deletar documento:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao deletar documento', details: error.message },
      { status: 500 }
    )
  }
}
