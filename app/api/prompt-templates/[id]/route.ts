import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePromptTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  active: z.boolean().optional(),
  category: z.string().optional().nullable(),
  stepKey: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.promptTemplate.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar template', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updatePromptTemplateSchema.parse(body)

    // Buscar template atual para verificar stepKey
    const current = await prisma.promptTemplate.findUnique({
      where: { id: params.id },
    })

    // Se este template será ativado, desativar os outros do mesmo stepKey
    if (data.active === true && current?.stepKey) {
      await prisma.promptTemplate.updateMany({
        where: { 
          stepKey: current.stepKey,
          category: current.category || null,
          active: true,
          id: { not: params.id },
        },
        data: { active: false },
      })
    } else if (data.active === true && !current?.stepKey) {
      await prisma.promptTemplate.updateMany({
        where: { 
          active: true,
          stepKey: null,
          id: { not: params.id },
        },
        data: { active: false },
      })
    }

    const template = await prisma.promptTemplate.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao atualizar template', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.promptTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao deletar template', details: error.message },
      { status: 500 }
    )
  }
}