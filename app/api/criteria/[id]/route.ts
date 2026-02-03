import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCriterionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  weight: z.number().min(0).max(5).optional(),
  examples: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
  goodExamples: z.string().optional().nullable(),
  badExamples: z.string().optional().nullable(),
  active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const criterion = await prisma.criterion.findUnique({
      where: { id: params.id },
    })

    if (!criterion) {
      return NextResponse.json(
        { error: 'Critério não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      criterion: {
        ...criterion,
        examples: JSON.parse(criterion.examples || '[]'),
        rules: JSON.parse(criterion.rules || '[]'),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar critério', details: error.message },
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
    const data = updateCriterionSchema.parse(body)

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.weight !== undefined) updateData.weight = data.weight
    if (data.examples !== undefined) updateData.examples = JSON.stringify(data.examples)
    if (data.rules !== undefined) updateData.rules = JSON.stringify(data.rules)
    if (data.goodExamples !== undefined) updateData.goodExamples = data.goodExamples
    if (data.badExamples !== undefined) updateData.badExamples = data.badExamples
    if (data.active !== undefined) updateData.active = data.active

    const criterion = await prisma.criterion.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      criterion: {
        ...criterion,
        examples: JSON.parse(criterion.examples || '[]'),
        rules: JSON.parse(criterion.rules || '[]'),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao atualizar critério', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.criterion.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao deletar critério', details: error.message },
      { status: 500 }
    )
  }
}