import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseFile } from '@/lib/knowledge/parsing'
import { smartChunk } from '@/lib/knowledge/chunking'
import { generateEmbeddingsBatch } from '@/lib/knowledge/embeddings'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { documentId, contextId } = body || {}

    // Se documentId fornecido, processar apenas esse documento
    if (documentId) {
      const result = await processDocument(documentId)
      if (result.success) {
        return NextResponse.json(result)
      }
      return NextResponse.json(
        { error: result.error || 'Erro ao processar documento', details: result.error },
        { status: 500 }
      )
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
        const result = await processDocument(doc.id)
        results.push(result)
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
      const result = await processDocument(doc.id)
      results.push(result)
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

async function processDocument(documentId: string): Promise<{
  documentId: string
  success: boolean
  chunksCreated?: number
  tokensUsed?: number
  processingTimeMs?: number
  error?: string
}> {
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
      // Normalizar caminho (Windows/Unix)
      const normalizedPath = path.normalize(document.filePath)
      try {
        await fs.access(normalizedPath)
      } catch (accessErr) {
        throw new Error(
          `Arquivo não encontrado: ${path.basename(normalizedPath)}. O arquivo pode ter sido movido ou excluído.`
        )
      }
      try {
        const parsed = await parseFile(normalizedPath, document.fileType || undefined)
        text = parsed.text
        metadata = parsed.metadata || {}
      } catch (parseErr: any) {
        const msg = parseErr?.message || String(parseErr)
        console.error('Erro ao fazer parse do arquivo:', parseErr)
        throw new Error(
          `Não foi possível ler o arquivo (${document.fileType || 'desconhecido'}). ` +
            `Verifique se o tipo é suportado (PDF, DOCX, TXT, MD) e se o arquivo não está corrompido. Detalhes: ${msg}`
        )
      }
    } else {
      throw new Error('Documento não possui conteúdo nem arquivo')
    }

    if (!text || text.trim().length === 0) {
      throw new Error('O documento está vazio ou não foi possível extrair texto do arquivo.')
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

    return {
      documentId,
      success: true,
      chunksCreated: chunks.length,
      tokensUsed: embeddingResults.reduce((sum, r) => sum + r.tokens, 0),
      processingTimeMs: processingTime,
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    // Atualizar status para error
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: 'error',
        errorMessage,
      },
    }).catch((updateErr) => console.error('Erro ao atualizar status do documento:', updateErr))

    return {
      documentId,
      success: false,
      error: errorMessage,
    }
  }
}
