import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const promptTemplateSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  active: z.boolean().optional(),
  category: z.string().optional().nullable(),
  stepKey: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const templates = await prisma.promptTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ templates })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar templates', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = promptTemplateSchema.parse(body)

    // Se este template será ativo, desativar os outros do mesmo stepKey (se houver)
    if (data.active && data.stepKey) {
      await prisma.promptTemplate.updateMany({
        where: { 
          stepKey: data.stepKey,
          category: data.category || null,
          active: true,
        },
        data: { active: false },
      })
    } else if (data.active && !data.stepKey) {
      // Para templates sem stepKey, desativar todos os ativos (comportamento antigo)
      await prisma.promptTemplate.updateMany({
        where: { 
          active: true,
          stepKey: null,
        },
        data: { active: false },
      })
    }

    // Buscar versão mais recente para incrementar
    const latest = await prisma.promptTemplate.findFirst({
      where: { name: data.name },
      orderBy: { version: 'desc' },
    })

    const newVersion = latest ? latest.version + 1 : 1

    // Salvar histórico se houver versão anterior
    let history = []
    if (latest) {
      history = JSON.parse(latest.history || '[]')
      history.push({
        version: latest.version,
        content: latest.content,
        createdAt: latest.updatedAt,
      })
    }

    const template = await prisma.promptTemplate.create({
      data: {
        name: data.name,
        content: data.content,
        active: data.active ?? false,
        version: newVersion,
        history: JSON.stringify(history),
        category: data.category || null,
        stepKey: data.stepKey || null,
      },
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao criar template', details: error.message },
      { status: 500 }
    )
  }
}