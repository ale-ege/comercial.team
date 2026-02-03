import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateEmbedding, cosineSimilarity } from '@/lib/knowledge/embeddings'
import { z } from 'zod'

const searchSchema = z.object({
  query: z.string().min(1, 'Query é obrigatória'),
  contextIds: z.array(z.string()).optional().default([]),
  topK: z.number().int().min(1).max(50).default(5),
  scoreThreshold: z.number().min(0).max(1).default(0.7),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, contextIds, topK, scoreThreshold } = searchSchema.parse(body)

    // Gerar embedding da query
    const queryEmbedding = await generateEmbedding(query)
    const queryVector = queryEmbedding.embedding

    // Buscar chunks
    let chunks
    if (contextIds.length > 0) {
      // Filtrar por contextos específicos
      chunks = await prisma.knowledgeChunk.findMany({
        where: {
          document: {
            contexts: {
              some: {
                contextId: {
                  in: contextIds,
                },
              },
            },
            status: 'indexed',
          },
          embedding: {
            not: null,
          },
        },
        include: {
          document: {
            include: {
              contexts: {
                include: {
                  context: true,
                },
              },
            },
          },
        },
      })
    } else {
      // Buscar todos os chunks indexados
      chunks = await prisma.knowledgeChunk.findMany({
        where: {
          document: {
            status: 'indexed',
          },
          embedding: {
            not: null,
          },
        },
        include: {
          document: {
            include: {
              contexts: {
                include: {
                  context: true,
                },
              },
            },
          },
        },
      })
    }

    // Calcular similaridade para cada chunk
    const scoredChunks = chunks
      .map((chunk) => {
        if (!chunk.embedding) return null

        try {
          const chunkVector = JSON.parse(chunk.embedding)
          const score = cosineSimilarity(queryVector, chunkVector)

          return {
            chunkId: chunk.id,
            content: chunk.content,
            score,
            metadata: chunk.metadata ? JSON.parse(chunk.metadata) : {},
            document: {
              id: chunk.document.id,
              title: chunk.document.title,
              source: chunk.document.source,
              fileType: chunk.document.fileType,
              contexts: chunk.document.contexts.map((dc) => ({
                id: dc.context.id,
                name: dc.context.name,
                type: dc.context.type,
              })),
            },
            chunkIndex: chunk.chunkIndex,
          }
        } catch (error) {
          console.warn('⚠️ Erro ao processar chunk:', chunk.id, error)
          return null
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item) => item.score >= scoreThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return NextResponse.json({
      query,
      results: scoredChunks,
      totalChunks: chunks.length,
      resultsCount: scoredChunks.length,
      tokensUsed: queryEmbedding.tokens,
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Erro de validação',
          details: error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao buscar', details: error.message },
      { status: 500 }
    )
  }
}
