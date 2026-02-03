import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateModelConfigSchema = z.object({
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional().nullable(),
  topP: z.number().min(0).max(1).optional().nullable(),
  maxTokens: z.number().min(1).max(16000).optional(),
  reasoningEffort: z.enum(['none', 'low', 'medium', 'high', 'xhigh']).optional().nullable(),
  verbosity: z.enum(['low', 'medium', 'high']).optional().nullable(),
  active: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateModelConfigSchema.parse(body)

    // Se esta config será ativada, desativar as outras
    if (data.active === true) {
      await prisma.modelConfig.updateMany({
        where: { active: true },
        data: { active: false },
      })
    }

    const updateData: any = {}
    if (data.model !== undefined) updateData.model = data.model
    if (data.temperature !== undefined) updateData.temperature = data.temperature
    if (data.topP !== undefined) updateData.topP = data.topP
    if (data.maxTokens !== undefined) updateData.maxTokens = data.maxTokens
    if (data.reasoningEffort !== undefined) updateData.reasoningEffort = data.reasoningEffort
    if (data.verbosity !== undefined) updateData.verbosity = data.verbosity
    if (data.active !== undefined) updateData.active = data.active

    const config = await prisma.modelConfig.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ config })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração', details: error.message },
      { status: 500 }
    )
  }
}