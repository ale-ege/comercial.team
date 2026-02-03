import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const approveSchema = z.object({
  approvedBy: z.string().optional(),
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
    const { approvedBy } = approveSchema.parse(body)

    // Buscar step
    const step = await prisma.proposalStep.findUnique({
      where: {
        proposalId_stepNumber: {
          proposalId: params.id,
          stepNumber,
        },
      },
    })

    if (!step) {
      return NextResponse.json(
        { error: 'Step não encontrado' },
        { status: 404 }
      )
    }

    // Se não há finalText mas há initialText ou questionsJson, usar como finalText
    if (!step.finalText) {
      if (step.initialText) {
        // Para steps normais: usar initialText como finalText
        await prisma.proposalStep.update({
          where: {
            proposalId_stepNumber: {
              proposalId: params.id,
              stepNumber,
            },
          },
          data: {
            finalText: step.initialText,
          },
        })
      } else if (stepNumber === 2 && step.questionsJson) {
        // Para Step 2: se só tem perguntas, criar um finalText básico indicando que foi aprovado sem versão ampliada
        await prisma.proposalStep.update({
          where: {
            proposalId_stepNumber: {
              proposalId: params.id,
              stepNumber,
            },
          },
          data: {
            finalText: '[Aprovado sem versão ampliada - apenas perguntas]',
          },
        })
      } else {
        return NextResponse.json(
          { error: 'Step não possui conteúdo inicial ou final. Gere o conteúdo primeiro.' },
          { status: 400 }
        )
      }
    }

    // Aprovar step
    const updatedStep = await prisma.proposalStep.update({
      where: {
        proposalId_stepNumber: {
          proposalId: params.id,
          stepNumber,
        },
      },
      data: {
        approvedAt: new Date(),
        approvedBy: approvedBy || null,
      },
    })

    // Verificar se todos os steps foram aprovados para atualizar status da proposta
    const allSteps = await prisma.proposalStep.findMany({
      where: { proposalId: params.id },
    })

    const allApproved = allSteps.every(s => s.approvedAt !== null)
    if (allApproved) {
      await prisma.proposal.update({
        where: { id: params.id },
        data: { status: 'completed' },
      })
    } else {
      await prisma.proposal.update({
        where: { id: params.id },
        data: { status: 'in_progress' },
      })
    }

    return NextResponse.json({
      success: true,
      step: updatedStep,
    })
  } catch (error: any) {
    console.error('Erro ao aprovar step:', error)
    return NextResponse.json(
      { error: 'Erro ao aprovar step', details: error.message },
      { status: 500 }
    )
  }
}
