import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const modelConfigSchema = z.object({
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).optional().nullable(),
  topP: z.number().min(0).max(1).optional().nullable(),
  maxTokens: z.number().min(1).max(16000),
  reasoningEffort: z.enum(['none', 'low', 'medium', 'high', 'xhigh']).optional().nullable(),
  verbosity: z.enum(['low', 'medium', 'high']).optional().nullable(),
  active: z.boolean().optional(),
})

export async function GET() {
  try {
    const config = await prisma.modelConfig.findFirst({
      where: { active: true },
    })
    return NextResponse.json({ config })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar configuração', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = modelConfigSchema.parse(body)

    // Se esta config será ativa, desativar as outras
    if (data.active) {
      await prisma.modelConfig.updateMany({
        where: { active: true },
        data: { active: false },
      })
    }

    const config = await prisma.modelConfig.create({
      data: {
        model: data.model,
        temperature: data.temperature ?? null,
        topP: data.topP ?? null,
        maxTokens: data.maxTokens,
        reasoningEffort: data.reasoningEffort ?? null,
        verbosity: data.verbosity ?? null,
        active: data.active ?? true,
      },
    })

    return NextResponse.json({ config })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao criar configuração', details: error.message },
      { status: 500 }
    )
  }
}