import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const contextSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  type: z.enum(['global', 'client', 'project']).default('global'),
  instructions: z.string().optional().nullable(),
  tone: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  active: z.boolean().optional().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const active = searchParams.get('active')

    const where: any = {}
    if (type) where.type = type
    if (active !== null) where.active = active === 'true'

    const contexts = await prisma.knowledgeContext.findMany({
      where,
      include: {
        documents: {
          include: {
            document: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formatar resposta com contagem de documentos
    const formatted = contexts.map((ctx) => ({
      ...ctx,
      tags: ctx.tags ? JSON.parse(ctx.tags) : [],
      documentCount: ctx.documents.length,
    }))

    return NextResponse.json({ contexts: formatted })
  } catch (error: any) {
    console.error('❌ Erro ao buscar contextos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contextos', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Dados recebidos para criar contexto:', JSON.stringify(body, null, 2))
    
    // Validar dados
    const data = contextSchema.parse(body)
    console.log('✅ Dados validados:', JSON.stringify(data, null, 2))

    // Validar nome não vazio após trim
    if (!data.name || data.name.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Erro de validação',
          details: 'Nome é obrigatório e não pode estar vazio',
        },
        { status: 400 }
      )
    }

    // Verificar se o modelo existe no Prisma Client
    if (!prisma.knowledgeContext) {
      console.error('❌ Prisma Client não reconhece o modelo KnowledgeContext')
      return NextResponse.json(
        {
          error: 'Erro de configuração do banco de dados',
          details: 'O modelo KnowledgeContext não foi encontrado. Execute: npx prisma generate && npx prisma db push',
        },
        { status: 500 }
      )
    }

    const context = await prisma.knowledgeContext.create({
      data: {
        name: data.name.trim(),
        description: data.description || null,
        type: data.type || 'global',
        instructions: data.instructions || null,
        tone: data.tone || null,
        tags: data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null,
        active: data.active ?? true,
      },
    })

    console.log('✅ Contexto criado com sucesso:', context.id)

    return NextResponse.json({
      context: {
        ...context,
        tags: context.tags ? JSON.parse(context.tags) : [],
        documentCount: 0,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao criar contexto:', error)
    console.error('❌ Stack:', error.stack)
    
    if (error.name === 'ZodError') {
      const validationErrors = error.errors?.map((e: any) => {
        const field = e.path.join('.')
        return `${field}: ${e.message}`
      }).join(', ')
      
      return NextResponse.json(
        {
          error: 'Erro de validação',
          details: validationErrors || 'Dados inválidos',
        },
        { status: 400 }
      )
    }

    // Erro específico: modelo não encontrado no Prisma Client
    if (error.message?.includes('knowledgeContext') || error.message?.includes('Cannot read properties')) {
      return NextResponse.json(
        {
          error: 'Erro de configuração do banco de dados',
          details: 'O modelo KnowledgeContext não foi encontrado no Prisma Client. Execute os seguintes comandos no terminal:\n\n1. npx prisma generate\n2. npx prisma db push\n3. Reinicie o servidor de desenvolvimento',
        },
        { status: 500 }
      )
    }

    // Erro do Prisma
    if (error.code) {
      console.error('❌ Erro do Prisma:', error.code, error.message)
      return NextResponse.json(
        { 
          error: 'Erro ao criar contexto no banco de dados', 
          details: error.message || 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erro ao criar contexto', 
        details: error.message || 'Erro desconhecido',
        hint: 'Se o erro persistir, execute: npx prisma generate && npx prisma db push'
      },
      { status: 500 }
    )
  }
}
