import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const contextPackSchema = z.object({
  contextIds: z.array(z.string()).min(1, 'Pelo menos um contexto é obrigatório'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contextIdsStr = searchParams.get('contextIds')

    if (!contextIdsStr) {
      return NextResponse.json(
        { error: 'Parâmetro contextIds é obrigatório' },
        { status: 400 }
      )
    }

    const contextIds = JSON.parse(contextIdsStr)

    return await buildContextPack(contextIds)
  } catch (error: any) {
    console.error('❌ Erro ao gerar context pack:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar context pack', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contextIds } = contextPackSchema.parse(body)

    return await buildContextPack(contextIds)
  } catch (error: any) {
    console.error('❌ Erro ao gerar context pack:', error)
    
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
      { error: 'Erro ao gerar context pack', details: error.message },
      { status: 500 }
    )
  }
}

async function buildContextPack(contextIds: string[]) {
  // Buscar contextos
  const contexts = await prisma.knowledgeContext.findMany({
    where: {
      id: {
        in: contextIds,
      },
      active: true,
    },
    include: {
      documents: {
        include: {
          document: {
            include: {
              chunks: {
                where: {
                  embedding: {
                    not: null,
                  },
                },
                orderBy: {
                  chunkIndex: 'asc',
                },
              },
            },
          },
        },
      },
    },
  })

  if (contexts.length === 0) {
    return NextResponse.json(
      { error: 'Nenhum contexto encontrado' },
      { status: 404 }
    )
  }

  // Consolidar instruções
  const instructions: string[] = []
  const tones: string[] = []

  for (const context of contexts) {
    if (context.instructions) {
      instructions.push(`[${context.name}] ${context.instructions}`)
    }
    if (context.tone) {
      tones.push(`${context.name}: ${context.tone}`)
    }
  }

  // Coletar todos os chunks dos documentos associados
  const allChunks: Array<{
    content: string
    documentTitle: string
    documentSource: string | null
    chunkIndex: number
    metadata: any
    contextName: string
  }> = []

  for (const context of contexts) {
    for (const docContext of context.documents) {
      const doc = docContext.document
      if (doc.status === 'indexed') {
        for (const chunk of doc.chunks) {
          allChunks.push({
            content: chunk.content,
            documentTitle: doc.title,
            documentSource: doc.source,
            chunkIndex: chunk.chunkIndex,
            metadata: chunk.metadata ? JSON.parse(chunk.metadata) : {},
            contextName: context.name,
          })
        }
      }
    }
  }

  // Construir texto do pack
  let packText = ''

  // Instruções consolidadas
  if (instructions.length > 0) {
    packText += '# INSTRUÇÕES DO CONTEXTO\n\n'
    packText += instructions.join('\n\n')
    packText += '\n\n'
  }

  // Tom/Linguagem
  if (tones.length > 0) {
    packText += '# TOM E LINGUAGEM\n\n'
    packText += tones.join('\n')
    packText += '\n\n'
  }

  // Conteúdo recuperado
  if (allChunks.length > 0) {
    packText += '# CONTEÚDO DE REFERÊNCIA\n\n'
    
    for (const chunk of allChunks) {
      packText += `## [${chunk.contextName}] ${chunk.documentTitle}`
      if (chunk.documentSource) {
        packText += ` (${chunk.documentSource})`
      }
      if (chunk.metadata.page) {
        packText += ` - Página ${chunk.metadata.page}`
      }
      if (chunk.metadata.heading) {
        packText += ` - ${chunk.metadata.heading}`
      }
      packText += '\n\n'
      packText += chunk.content
      packText += '\n\n---\n\n'
    }
  }

  return NextResponse.json({
    contextPack: packText,
    contexts: contexts.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      documentCount: c.documents.length,
    })),
    totalChunks: allChunks.length,
    instructionsCount: instructions.length,
  })
}
