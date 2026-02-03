/**
 * Estratégias de chunking para diferentes tipos de documentos
 */

export interface ChunkMetadata {
  chunkIndex: number
  page?: number
  heading?: string
  startChar?: number
  endChar?: number
}

export interface Chunk {
  content: string
  metadata: ChunkMetadata
}

/**
 * Chunking por tamanho fixo com overlap
 */
export function chunkBySize(
  text: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): Chunk[] {
  const chunks: Chunk[] = []
  let start = 0
  let chunkIndex = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const content = text.slice(start, end).trim()

    if (content.length > 0) {
      chunks.push({
        content,
        metadata: {
          chunkIndex,
          startChar: start,
          endChar: end,
        },
      })
      chunkIndex++
    }

    start = end - chunkOverlap
    if (start >= text.length) break
  }

  return chunks
}

/**
 * Chunking por headings (para Markdown e documentos estruturados)
 */
export function chunkByHeadings(text: string): Chunk[] {
  const chunks: Chunk[] = []
  const lines = text.split('\n')
  let currentChunk: string[] = []
  let currentHeading: string | undefined
  let chunkIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)

    if (headingMatch) {
      // Salvar chunk anterior se existir
      if (currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.join('\n').trim(),
          metadata: {
            chunkIndex,
            heading: currentHeading,
          },
        })
        chunkIndex++
        currentChunk = []
      }
      currentHeading = headingMatch[2]
      currentChunk.push(line)
    } else {
      currentChunk.push(line)
    }
  }

  // Adicionar último chunk
  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk.join('\n').trim(),
      metadata: {
        chunkIndex,
        heading: currentHeading,
      },
    })
  }

  return chunks.length > 0 ? chunks : chunkBySize(text) // Fallback para chunk por tamanho
}

/**
 * Chunking por páginas (para PDFs)
 */
export function chunkByPages(
  pages: string[],
  maxChunkSize: number = 2000
): Chunk[] {
  const chunks: Chunk[] = []
  let chunkIndex = 0

  for (let pageNum = 0; pageNum < pages.length; pageNum++) {
    const pageText = pages[pageNum].trim()
    
    if (pageText.length <= maxChunkSize) {
      // Página cabe em um chunk
      chunks.push({
        content: pageText,
        metadata: {
          chunkIndex,
          page: pageNum + 1,
        },
      })
      chunkIndex++
    } else {
      // Dividir página em múltiplos chunks
      const pageChunks = chunkBySize(pageText, maxChunkSize, 200)
      for (const chunk of pageChunks) {
        chunks.push({
          content: chunk.content,
          metadata: {
            ...chunk.metadata,
            chunkIndex,
            page: pageNum + 1,
          },
        })
        chunkIndex++
      }
    }
  }

  return chunks
}

/**
 * Chunking inteligente baseado no tipo de documento
 */
export function smartChunk(
  text: string,
  fileType?: string,
  options: {
    chunkSize?: number
    chunkOverlap?: number
  } = {}
): Chunk[] {
  const { chunkSize = 1000, chunkOverlap = 200 } = options

  // Para Markdown, tentar chunk por headings primeiro
  if (fileType === 'md' || fileType === 'markdown') {
    const headingChunks = chunkByHeadings(text)
    if (headingChunks.length > 1) {
      return headingChunks
    }
  }

  // Fallback: chunk por tamanho
  return chunkBySize(text, chunkSize, chunkOverlap)
}
