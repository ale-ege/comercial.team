import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseFile } from '@/lib/knowledge/parsing'
import { smartChunk } from '@/lib/knowledge/chunking'
import { generateEmbeddingsBatch } from '@/lib/knowledge/embeddings'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, contextId } = body

    // Se documentId fornecido, processar apenas esse documento
    if (documentId) {
      return await processDocument(documentId)
    }

    // Se contextId fornecido, processar todos os documentos do contexto
    if (contextId) {
      const documents = await prisma.knowledgeDocument.findMany({
        where: {
          contexts: {
            some: {
              contextId,
            },
          },
          status: {
            in: ['pending', 'error'],
          },
        },
      })

      const results = []
      for (const doc of documents) {
        try {
          const result = await processDocument(doc.id)
          results.push(result)
        } catch (error: any) {
          results.push({
            documentId: doc.id,
            success: false,
            error: error.message,
          })
        }
      }

      return NextResponse.json({
        success: true,
        processed: results.length,
        results,
      })
    }

    // Processar todos os documentos pendentes
    const documents = await prisma.knowledgeDocument.findMany({
      where: {
        status: {
          in: ['pending', 'error'],
        },
      },
    })

    const results = []
    for (const doc of documents) {
      try {
        const result = await processDocument(doc.id)
        results.push(result)
      } catch (error: any) {
        results.push({
          documentId: doc.id,
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error: any) {
    console.error('❌ Erro ao indexar:', error)
    return NextResponse.json(
      { error: 'Erro ao indexar', details: error.message },
      { status: 500 }
    )
  }
}

async function processDocument(documentId: string) {
  const startTime = Date.now()

  // Atualizar status para processing
  await prisma.knowledgeDocument.update({
    where: { id: documentId },
    data: {
      status: 'processing',
      errorMessage: null,
    },
  })

  try {
    // Buscar documento
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error('Documento não encontrado')
    }

    // Deletar chunks existentes
    await prisma.knowledgeChunk.deleteMany({
      where: { documentId },
    })

    let text = ''
    let metadata: any = {}

    // Obter texto do documento
    if (document.content) {
      // Texto colado diretamente
      text = document.content
    } else if (document.filePath) {
      // Arquivo uploadado - fazer parsing
      const parsed = await parseFile(document.filePath, document.fileType || undefined)
      text = parsed.text
      metadata = parsed.metadata
    } else {
      throw new Error('Documento não possui conteúdo nem arquivo')
    }

    // Chunking
    const chunks = smartChunk(text, document.fileType || undefined, {
      chunkSize: 1000,
      chunkOverlap: 200,
    })

    if (chunks.length === 0) {
      throw new Error('Nenhum chunk gerado do documento')
    }

    // Gerar embeddings em batch
    const chunkTexts = chunks.map((c) => c.content)
    const embeddingResults = await generateEmbeddingsBatch(chunkTexts)

    if (embeddingResults.length !== chunks.length) {
      throw new Error('Erro ao gerar embeddings para todos os chunks')
    }

    // Salvar chunks com embeddings
    const chunksToCreate = chunks.map((chunk, index) => ({
      documentId,
      chunkIndex: index,
      content: chunk.content,
      embedding: JSON.stringify(embeddingResults[index].embedding),
      metadata: JSON.stringify({
        ...chunk.metadata,
        ...metadata,
      }),
    }))

    await prisma.knowledgeChunk.createMany({
      data: chunksToCreate,
    })

    // Atualizar documento
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: 'indexed',
        processedAt: new Date(),
        metadata: JSON.stringify(metadata),
      },
    })

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      documentId,
      success: true,
      chunksCreated: chunks.length,
      tokensUsed: embeddingResults.reduce((sum, r) => sum + r.tokens, 0),
      processingTimeMs: processingTime,
    })
  } catch (error: any) {
    // Atualizar status para error
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: 'error',
        errorMessage: error.message,
      },
    })

    return NextResponse.json(
      { error: 'Erro ao processar documento', details: error.message },
      { status: 500 }
    )
  }
}
