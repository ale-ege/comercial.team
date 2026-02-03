import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStepSchema = z.object({
  closerNotes: z.string().optional().nullable(),
  closerAnswers: z.string().optional().nullable(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; stepNumber: string } }
) {
  try {
    const stepNumber = parseInt(params.stepNumber)
    if (stepNumber < 1 || stepNumber > 10) {
      return NextResponse.json(
        { error: 'Step number deve estar entre 1 e 10' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = updateStepSchema.parse(body)

    const step = await prisma.proposalStep.upsert({
      where: {
        proposalId_stepNumber: {
          proposalId: params.id,
          stepNumber,
        },
      },
      create: {
        proposalId: params.id,
        stepNumber,
        stepKey: `proposal.step${stepNumber}`,
        closerNotes: data.closerNotes,
        closerAnswers: data.closerAnswers,
      },
      update: {
        ...(data.closerNotes !== undefined && { closerNotes: data.closerNotes }),
        ...(data.closerAnswers !== undefined && { closerAnswers: data.closerAnswers }),
      },
    })

    return NextResponse.json({
      success: true,
      step,
    })
  } catch (error: any) {
    console.error('Erro ao atualizar step:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar step', details: error.message },
      { status: 500 }
    )
  }
}
