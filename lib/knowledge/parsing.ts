import fs from 'fs/promises'
import path from 'path'

// Importar bibliotecas de parsing (opcional - podem não estar instaladas)
let pdfParse: any = null
let mammoth: any = null

// Tentar importar pdf-parse
try {
  const pdfParseModule = require('pdf-parse')
  // pdf-parse pode ser exportado como default ou diretamente
  pdfParse = pdfParseModule.default || pdfParseModule
  // Se ainda não for função, tentar acessar diretamente
  if (typeof pdfParse !== 'function') {
    pdfParse = pdfParseModule
  }
} catch (e) {
  console.warn('⚠️ pdf-parse não disponível. Execute: npm install pdf-parse')
}

// Tentar importar mammoth
try {
  const mammothModule = require('mammoth')
  // mammoth geralmente é exportado diretamente
  mammoth = mammothModule.default || mammothModule
} catch (e) {
  console.warn('⚠️ mammoth não disponível. Execute: npm install mammoth')
}

/**
 * Parsers para diferentes tipos de arquivos
 */

export interface ParsedDocument {
  text: string
  metadata: {
    pages?: number
    headings?: string[]
    [key: string]: any
  }
}

/**
 * Parse texto simples
 */
export async function parseText(content: string): Promise<ParsedDocument> {
  return {
    text: content.trim(),
    metadata: {},
  }
}

/**
 * Parse Markdown
 */
export async function parseMarkdown(content: string): Promise<ParsedDocument> {
  const headings: string[] = []
  const lines = content.split('\n')
  
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      headings.push(headingMatch[2])
    }
  }

  return {
    text: content.trim(),
    metadata: {
      headings,
    },
  }
}

/**
 * Parse PDF (usando biblioteca externa quando disponível)
 */
export async function parsePDF(filePath: string): Promise<ParsedDocument> {
  // Tentar importar dinamicamente para garantir que funciona
  let pdfParseFunction: any = null
  
  try {
    // Tentar import dinâmico primeiro (funciona melhor no Next.js)
    const pdfParseModule = await import('pdf-parse')
    pdfParseFunction = pdfParseModule.default || pdfParseModule
  } catch (importError) {
    // Se import dinâmico falhar, tentar usar o require já carregado
    pdfParseFunction = pdfParse
  }

  // Se ainda não tiver função, tentar require novamente
  if (!pdfParseFunction || typeof pdfParseFunction !== 'function') {
    try {
      const pdfParseModule = require('pdf-parse')
      pdfParseFunction = pdfParseModule.default || pdfParseModule
      // Se ainda não for função, pode ser que seja o módulo completo
      if (typeof pdfParseFunction !== 'function' && pdfParseModule) {
        // Tentar acessar como função diretamente
        pdfParseFunction = pdfParseModule
      }
    } catch (requireError) {
      throw new Error(
        'Biblioteca pdf-parse não está instalada. Execute: npm install pdf-parse'
      )
    }
  }

  if (typeof pdfParseFunction !== 'function') {
    throw new Error(
      'Biblioteca pdf-parse não foi carregada corretamente. Tente reinstalar: npm install pdf-parse'
    )
  }

  try {
    const dataBuffer = await fs.readFile(filePath)
    const data = await pdfParseFunction(dataBuffer)
    
    return {
      text: data.text || '',
      metadata: {
        pages: data.numpages || 0,
        info: data.info || {},
      },
    }
  } catch (error: any) {
    console.error('Erro ao parsear PDF:', error)
    throw new Error(`Erro ao parsear PDF: ${error.message || 'Erro desconhecido'}`)
  }
}

/**
 * Parse DOCX (usando biblioteca externa quando disponível)
 */
export async function parseDOCX(filePath: string): Promise<ParsedDocument> {
  // Tentar importar dinamicamente para garantir que funciona
  let mammothModule: any = null
  
  try {
    // Tentar import dinâmico primeiro (funciona melhor no Next.js)
    const mammothImport = await import('mammoth')
    mammothModule = mammothImport.default || mammothImport
  } catch (importError) {
    // Se import dinâmico falhar, tentar usar o require já carregado
    mammothModule = mammoth
  }

  // Se ainda não tiver módulo, tentar require novamente
  if (!mammothModule) {
    try {
      mammothModule = require('mammoth')
    } catch (requireError) {
      throw new Error(
        'Biblioteca mammoth não está instalada. Execute: npm install mammoth'
      )
    }
  }

  if (!mammothModule || typeof mammothModule.extractRawText !== 'function') {
    throw new Error(
      'Biblioteca mammoth não foi carregada corretamente. Tente reinstalar: npm install mammoth'
    )
  }

  try {
    const result = await mammothModule.extractRawText({ path: filePath })
    
    return {
      text: result.value || '',
      metadata: {
        messages: result.messages || [],
      },
    }
  } catch (error: any) {
    console.error('Erro ao parsear DOCX:', error)
    throw new Error(`Erro ao parsear DOCX: ${error.message || 'Erro desconhecido'}`)
  }
}

/**
 * Parse arquivo baseado na extensão
 */
export async function parseFile(
  filePath: string,
  fileType?: string
): Promise<ParsedDocument> {
  const ext = fileType || path.extname(filePath).toLowerCase().slice(1)

  switch (ext) {
    case 'txt':
      const content = await fs.readFile(filePath, 'utf-8')
      return parseText(content)
    
    case 'md':
    case 'markdown':
      const mdContent = await fs.readFile(filePath, 'utf-8')
      return parseMarkdown(mdContent)
    
    case 'pdf':
      return parsePDF(filePath)
    
    case 'docx':
    case 'doc':
      return parseDOCX(filePath)
    
    default:
      // Tentar como texto simples
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        return parseText(content)
      } catch {
        throw new Error(`Tipo de arquivo não suportado: ${ext}`)
      }
  }
}
