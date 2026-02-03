import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Atualizar status para processing
    await prisma.knowledgeDocument.update({
      where: { id: params.id },
      data: {
        status: 'processing',
        errorMessage: null,
      },
    })

    // Buscar documento
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    // Deletar chunks existentes
    await prisma.knowledgeChunk.deleteMany({
      where: { documentId: params.id },
    })

    // Processar documento (parsing, chunking, embeddings)
    // Isso será feito pela API de indexação
    // Por enquanto, apenas resetar status
    await prisma.knowledgeDocument.update({
      where: { id: params.id },
      data: {
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Documento marcado para reprocessamento',
    })
  } catch (error: any) {
    console.error('❌ Erro ao reprocessar documento:', error)
    
    // Resetar status em caso de erro
    try {
      await prisma.knowledgeDocument.update({
        where: { id: params.id },
        data: {
          status: 'error',
          errorMessage: error.message,
        },
      })
    } catch {}

    return NextResponse.json(
      { error: 'Erro ao reprocessar documento', details: error.message },
      { status: 500 }
    )
  }
}
