import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (openaiClient) return openaiClient

  const apiKey = process.env.OPENAI_API_KEY?.trim() || 
                 process.env.NEXT_PUBLIC_OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não está configurada')
  }

  openaiClient = new OpenAI({ apiKey })
  return openaiClient
}

export interface EmbeddingResult {
  embedding: number[]
  tokens: number
}

/**
 * Gera embedding para um texto usando OpenAI
 */
export async function generateEmbedding(
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<EmbeddingResult> {
  const client = getOpenAIClient()
  
  try {
    const response = await client.embeddings.create({
      model,
      input: text.trim(),
    })

    const embedding = response.data[0].embedding
    const tokens = response.usage?.total_tokens || 0

    return { embedding, tokens }
  } catch (error: any) {
    console.error('Erro ao gerar embedding:', error)
    throw new Error(`Erro ao gerar embedding: ${error.message}`)
  }
}

/**
 * Gera embeddings em batch (com rate limiting básico)
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  model: string = 'text-embedding-3-small',
  batchSize: number = 100
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = []
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    
    const batchPromises = batch.map(text => 
      generateEmbedding(text, model).catch(err => {
        console.error(`Erro ao gerar embedding para texto ${i}:`, err)
        return null
      })
    )

    const batchResults = await Promise.all(batchPromises)
    
    for (const result of batchResults) {
      if (result) {
        results.push(result)
      }
    }

    // Rate limiting básico: aguardar 100ms entre batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * Calcula similaridade de cosseno entre dois vetores
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vetores devem ter o mesmo tamanho')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0

  return dotProduct / denominator
}
