import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateEmbedding, cosineSimilarity } from '@/lib/knowledge/embeddings'
import { getOpenAIClient } from '@/lib/openai'
import { z } from 'zod'

const chatSchema = z.object({
  question: z.string().min(1, 'Pergunta é obrigatória'),
  contextIds: z.array(z.string()).optional().default([]),
  topK: z.number().int().min(1).max(10).default(5),
  scoreThreshold: z.number().min(0).max(1).default(0.6),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, contextIds, topK, scoreThreshold, conversationHistory } = chatSchema.parse(body)

    console.log('💬 Iniciando chat RAG:', { question, contextIds, topK })

    // 1. Buscar contexto relevante usando RAG
    const queryEmbedding = await generateEmbedding(question)
    const queryVector = queryEmbedding.embedding

    // Buscar chunks relevantes
    let chunks
    if (contextIds.length > 0) {
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
      // Buscar em todos os contextos
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

    // Calcular similaridade e filtrar
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

    console.log(`📊 Encontrados ${scoredChunks.length} chunks relevantes`)

    // 2. Buscar instruções dos contextos selecionados
    let contextInstructions = ''
    let contextTones = ''

    if (contextIds.length > 0) {
      const contexts = await prisma.knowledgeContext.findMany({
        where: {
          id: { in: contextIds },
          active: true,
        },
      })

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

      if (instructions.length > 0) {
        contextInstructions = instructions.join('\n\n')
      }
      if (tones.length > 0) {
        contextTones = tones.join('\n')
      }
    }

    // 3. Construir contexto para o prompt
    let contextText = ''
    if (scoredChunks.length > 0) {
      contextText = scoredChunks
        .map((chunk, idx) => {
          let chunkText = `[Fonte ${idx + 1}]\n`
          chunkText += `Documento: ${chunk.document.title}\n`
          if (chunk.document.source) {
            chunkText += `Fonte: ${chunk.document.source}\n`
          }
          if (chunk.metadata.page) {
            chunkText += `Página: ${chunk.metadata.page}\n`
          }
          chunkText += `Conteúdo:\n${chunk.content}\n`
          chunkText += `(Relevância: ${(chunk.score * 100).toFixed(1)}%)\n`
          return chunkText
        })
        .join('\n---\n\n')
    }

    // 4. Construir histórico da conversa
    let historyText = ''
    if (conversationHistory.length > 0) {
      historyText = conversationHistory
        .map((msg) => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
        .join('\n\n')
    }

    // 5. Construir prompt para o modelo
    const systemPrompt = `Você é um assistente especializado em responder perguntas baseado no conhecimento fornecido.

${contextInstructions ? `INSTRUÇÕES DO CONTEXTO:\n${contextInstructions}\n\n` : ''}
${contextTones ? `TOM E LINGUAGEM:\n${contextTones}\n\n` : ''}
INSTRUÇÕES GERAIS:
- Use APENAS as informações fornecidas no contexto abaixo para responder
- Se a informação não estiver no contexto, diga claramente que não possui essa informação
- Cite as fontes quando relevante
- Seja preciso e objetivo
- Se houver múltiplas fontes, consolide a informação de forma coerente
- Responda em português brasileiro`

    const userPrompt = `${contextText ? `CONTEXTO RELEVANTE:\n\n${contextText}\n\n` : ''}${historyText ? `HISTÓRICO DA CONVERSA:\n\n${historyText}\n\n` : ''}PERGUNTA DO USUÁRIO:\n${question}\n\nRESPOSTA:`

    // 6. Gerar resposta usando OpenAI
    const openai = getOpenAIClient()
    
    // Buscar configuração do modelo
    const modelConfig = await prisma.modelConfig.findFirst({
      where: { active: true },
    })

    const model = modelConfig?.model || 'gpt-5.2'
    const isGPT5 = model.startsWith('gpt-5')
    
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    const requestOptions: any = {
      model,
      messages,
      max_completion_tokens: 2000,
    }

    // Adicionar parâmetros específicos do GPT-5.2 se aplicável
    if (isGPT5) {
      requestOptions.reasoning = {
        effort: modelConfig?.reasoningEffort || 'none',
      }
      requestOptions.text = {
        verbosity: modelConfig?.verbosity || 'medium',
      }
    } else {
      if (modelConfig?.temperature !== undefined) {
        requestOptions.temperature = modelConfig.temperature
      }
      if (modelConfig?.topP !== undefined) {
        requestOptions.top_p = modelConfig.topP
      }
    }

    console.log('🤖 Chamando OpenAI API...')
    const completion = await openai.chat.completions.create(requestOptions)

    const response = completion.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.'

    console.log('✅ Resposta gerada com sucesso')

    return NextResponse.json({
      answer: response,
      sources: scoredChunks.map((chunk) => ({
        documentTitle: chunk.document.title,
        documentSource: chunk.document.source,
        contexts: chunk.document.contexts.map((c) => c.name),
        score: chunk.score,
        chunkIndex: chunk.chunkIndex,
        page: chunk.metadata.page,
      })),
      tokensUsed: completion.usage?.total_tokens || 0,
      chunksUsed: scoredChunks.length,
    })
  } catch (error: any) {
    console.error('❌ Erro no chat RAG:', error)
    
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
      { error: 'Erro ao processar pergunta', details: error.message },
      { status: 500 }
    )
  }
}
