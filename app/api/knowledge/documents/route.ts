import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const contextId = searchParams.get('contextId')

    const where: any = {}
    if (status) where.status = status
    if (contextId) {
      where.contexts = {
        some: {
          contextId,
        },
      }
    }

    const documents = await prisma.knowledgeDocument.findMany({
      where,
      include: {
        contexts: {
          include: {
            context: true,
          },
        },
        chunks: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = documents.map((doc) => ({
      ...doc,
      tags: doc.tags ? JSON.parse(doc.tags) : [],
      metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
      contextIds: doc.contexts.map((dc) => dc.contextId),
      chunkCount: doc.chunks.length,
    }))

    return NextResponse.json({ documents: formatted })
  } catch (error: any) {
    console.error('❌ Erro ao buscar documentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar documentos', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Iniciando criação de documento...')
    
    const formData = await request.formData()
    const title = formData.get('title') as string
    const source = formData.get('source') as string | null
    const content = formData.get('content') as string | null
    const fileType = formData.get('fileType') as string | null
    const language = (formData.get('language') as string) || 'pt-BR'
    const tagsStr = formData.get('tags') as string | null
    const contextIdsStr = formData.get('contextIds') as string | null
    const file = formData.get('file') as File | null

    console.log('📋 Dados recebidos:', {
      title,
      hasFile: !!file,
      fileSize: file?.size,
      contextIdsStr,
      tagsStr,
    })

    // Validar dados básicos
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      )
    }

    // Processar tags e contextIds
    let tags: string[] = []
    let contextIds: string[] = []
    
    try {
      tags = tagsStr ? JSON.parse(tagsStr) : []
    } catch (e) {
      console.warn('⚠️ Erro ao parsear tags, usando array vazio')
      tags = []
    }
    
    try {
      contextIds = contextIdsStr ? JSON.parse(contextIdsStr) : []
    } catch (e) {
      console.warn('⚠️ Erro ao parsear contextIds, usando array vazio')
      contextIds = []
    }

    // Validar que os contextos existem
    if (contextIds.length > 0) {
      const existingContexts = await prisma.knowledgeContext.findMany({
        where: {
          id: { in: contextIds },
          active: true,
        },
        select: { id: true },
      })
      
      const existingIds = existingContexts.map((c) => c.id)
      const invalidIds = contextIds.filter((id) => !existingIds.includes(id))
      
      if (invalidIds.length > 0) {
        console.warn('⚠️ Alguns contextos não foram encontrados:', invalidIds)
        // Remover contextos inválidos
        contextIds = existingIds
      }
    }

    let filePath: string | null = null
    let finalFileType: string | null = fileType

    // Se houver arquivo, salvar
    if (file && file.size > 0) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'knowledge')
      await fs.mkdir(uploadDir, { recursive: true })

      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      filePath = path.join(uploadDir, fileName)

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await fs.writeFile(filePath, buffer)

      // Detectar tipo de arquivo se não fornecido
      if (!finalFileType) {
        const ext = path.extname(file.name).toLowerCase().slice(1)
        if (['pdf', 'docx', 'txt', 'md'].includes(ext)) {
          finalFileType = ext
        }
      }
    }

    // Verificar se os modelos existem no Prisma Client
    console.log('🔍 Verificando modelos do Prisma...')
    console.log('Prisma Client disponível:', !!prisma)
    console.log('KnowledgeDocument disponível:', !!prisma.knowledgeDocument)
    
    if (!prisma.knowledgeDocument) {
      console.error('❌ Prisma Client não reconhece o modelo KnowledgeDocument')
      console.error('Prisma Client keys:', Object.keys(prisma))
      return NextResponse.json(
        {
          error: 'Erro de configuração do banco de dados',
          details: 'O modelo KnowledgeDocument não foi encontrado. Execute: npx prisma generate && npx prisma db push',
        },
        { status: 500 }
      )
    }

    // Criar documento
    console.log('📄 Criando documento no banco de dados...')
    let document
    try {
      document = await prisma.knowledgeDocument.create({
        data: {
          title: title.trim(),
          source: source || null,
          content: content || null,
          filePath,
          fileType: finalFileType,
          language,
          tags: tags.length > 0 ? JSON.stringify(tags) : null,
          status: 'pending',
        },
      })
      console.log('✅ Documento criado com sucesso:', document.id)
    } catch (createError: any) {
      console.error('❌ Erro ao criar documento:', createError)
      console.error('❌ Erro completo:', JSON.stringify(createError, null, 2))
      throw createError
    }

    // Associar contextos
    if (contextIds.length > 0) {
      console.log('🔗 Associando contextos:', contextIds)
      try {
        // Verificar se o modelo DocumentContext existe
        if (!prisma.documentContext) {
          console.error('❌ Prisma Client não reconhece o modelo DocumentContext')
          console.warn('⚠️ Documento criado mas contextos não foram associados')
        } else {
          // Criar associações uma por uma para evitar duplicatas
          for (const contextId of contextIds) {
            try {
              await prisma.documentContext.create({
                data: {
                  documentId: document.id,
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
          console.log('✅ Contextos associados com sucesso')
        }
      } catch (contextError: any) {
        console.error('❌ Erro ao associar contextos:', contextError)
        console.error('❌ Erro completo:', JSON.stringify(contextError, null, 2))
        // Não falhar a criação do documento se houver erro ao associar contextos
        console.warn('⚠️ Documento criado mas houve erro ao associar contextos:', contextError.message)
      }
    }

    // Buscar documento completo (fallback para o objeto criado se findUnique falhar)
    const fetchedDoc = await prisma.knowledgeDocument.findUnique({
      where: { id: document.id },
      include: {
        contexts: {
          include: {
            context: true,
          },
        },
        chunks: true,
      },
    })

    const fullDocument =
      fetchedDoc ??
      ({
        ...document,
        contexts: [],
        chunks: [],
      } as any)

    const documentTags = fullDocument.tags ? JSON.parse(fullDocument.tags) : []
    const metadata = fullDocument.metadata ? JSON.parse(fullDocument.metadata) : null
    const documentContextIds =
      fullDocument.contexts?.map((dc: any) => dc.contextId) || []
    const chunkCount = fullDocument.chunks?.length ?? 0

    return NextResponse.json({
      document: {
        ...fullDocument,
        tags: documentTags,
        metadata,
        contextIds: documentContextIds,
        chunkCount,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao criar documento:', error)
    console.error('❌ Stack:', error.stack)
    
    if (error.message?.includes('JSON')) {
      return NextResponse.json(
        {
          error: 'Erro de validação',
          details: error.message,
        },
        { status: 400 }
      )
    }

    // Erro específico: modelo não encontrado no Prisma Client
    if (error.message?.includes('knowledgeDocument') || 
        error.message?.includes('documentContext') ||
        error.message?.includes('Cannot read properties')) {
      return NextResponse.json(
        {
          error: 'Erro de configuração do banco de dados',
          details: 'Os modelos de conhecimento não foram encontrados no Prisma Client. Execute os seguintes comandos no terminal:\n\n1. npx prisma generate\n2. npx prisma db push\n3. Reinicie o servidor de desenvolvimento',
        },
        { status: 500 }
      )
    }

    // Erro do Prisma
    if (error.code) {
      console.error('❌ Erro do Prisma:', error.code, error.message)
      return NextResponse.json(
        { 
          error: 'Erro ao criar documento no banco de dados', 
          details: error.message || 'Erro desconhecido',
          code: error.code,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erro ao criar documento', 
        details: error.message || 'Erro desconhecido',
        hint: 'Se o erro persistir, execute: npx prisma generate && npx prisma db push'
      },
      { status: 500 }
    )
  }
}
