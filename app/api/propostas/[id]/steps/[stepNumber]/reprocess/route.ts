import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateProposalStep } from '@/lib/proposalPrompts'
import { PROPOSAL_STEPS } from '@/lib/proposal'
import { z } from 'zod'

const reprocessSchema = z.object({
  closerNotes: z.string().optional().nullable(),
  closerAnswers: z.string().optional().nullable(),
})

export async function POST(
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
    const { closerNotes, closerAnswers } = reprocessSchema.parse(body)

    // Buscar step existente
    const existingStep = await prisma.proposalStep.findUnique({
      where: {
        proposalId_stepNumber: {
          proposalId: params.id,
          stepNumber,
        },
      },
    })

    if (!existingStep) {
      return NextResponse.json(
        { error: 'Step não encontrado. Gere o conteúdo inicial primeiro.' },
        { status: 404 }
      )
    }

    // Para step 2, se não tiver questionsJson ainda, gerar perguntas primeiro
    if (stepNumber === 2 && !existingStep.questionsJson && !closerAnswers) {
      const questionsResult = await generateProposalStep(params.id, stepNumber)
      await prisma.proposalStep.update({
        where: {
          proposalId_stepNumber: {
            proposalId: params.id,
            stepNumber,
          },
        },
        data: {
          questionsJson: questionsResult.questionsJson,
        },
      })
    }

    // Atualizar notas/respostas
    await prisma.proposalStep.update({
      where: {
        proposalId_stepNumber: {
          proposalId: params.id,
          stepNumber,
        },
      },
      data: {
        closerNotes: closerNotes || existingStep.closerNotes,
        closerAnswers: closerAnswers || existingStep.closerAnswers,
      },
    })

    // Gerar versão final incorporando notas/respostas
    const result = await generateProposalStep(params.id, stepNumber, {
      closerNotes: closerNotes || existingStep.closerNotes,
      closerAnswers: closerAnswers || existingStep.closerAnswers,
      questionsJson: existingStep.questionsJson,
    })

    // Atualizar finalText
    const updatedStep = await prisma.proposalStep.update({
      where: {
        proposalId_stepNumber: {
          proposalId: params.id,
          stepNumber,
        },
      },
      data: {
        finalText: result.initialText, // Para reprocess, initialText é a versão final
      },
    })

    return NextResponse.json({
      success: true,
      step: updatedStep,
    })
  } catch (error: any) {
    console.error('Erro ao reprocessar step:', error)
    return NextResponse.json(
      { error: 'Erro ao reprocessar step', details: error.message },
      { status: 500 }
    )
  }
}
