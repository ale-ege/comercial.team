import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateProposalStep } from '@/lib/proposalPrompts'
import { PROPOSAL_STEPS } from '@/lib/proposal'
import { z } from 'zod'

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

    const step = PROPOSAL_STEPS.find(s => s.number === stepNumber)
    if (!step) {
      return NextResponse.json(
        { error: 'Step não encontrado' },
        { status: 400 }
      )
    }

    // Verificar se step já existe
    const existingStep = await prisma.proposalStep.findUnique({
      where: {
        proposalId_stepNumber: {
          proposalId: params.id,
          stepNumber,
        },
      },
    })

    if (existingStep && existingStep.initialText) {
      return NextResponse.json({
        success: true,
        step: existingStep,
        message: 'Step já possui conteúdo inicial',
      })
    }

    // Gerar conteúdo
    const result = await generateProposalStep(params.id, stepNumber)

    // Criar ou atualizar step
    const proposalStep = await prisma.proposalStep.upsert({
      where: {
        proposalId_stepNumber: {
          proposalId: params.id,
          stepNumber,
        },
      },
      create: {
        proposalId: params.id,
        stepNumber,
        stepKey: step.key,
        initialText: result.initialText,
        questionsJson: result.questionsJson,
      },
      update: {
        initialText: result.initialText,
        questionsJson: result.questionsJson,
      },
    })

    return NextResponse.json({
      success: true,
      step: proposalStep,
    })
  } catch (error: any) {
    console.error('Erro ao gerar step:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar step', details: error.message },
      { status: 500 }
    )
  }
}
