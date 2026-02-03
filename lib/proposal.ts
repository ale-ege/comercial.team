import { prisma } from './prisma'

export const PROPOSAL_STEPS = [
  { number: 1, key: 'proposal.step1.summary', title: 'Ideia Inicial do Projeto' },
  { number: 2, key: 'proposal.step2.questions', title: 'Escopo do Projeto' },
  { number: 3, key: 'proposal.step3.context', title: 'Contexto do Cliente e Desafio' },
  { number: 4, key: 'proposal.step4.objectives', title: 'Objetivos do Projeto' },
  { number: 5, key: 'proposal.step5.solution', title: 'Visão Geral da Solução Getter' },
  { number: 6, key: 'proposal.step6.scope', title: 'Escopo Funcional do Projeto' },
  { number: 7, key: 'proposal.step7.phases', title: 'Fases do Projeto' },
  { number: 8, key: 'proposal.step8.deliverables', title: 'Entregáveis por Fase' },
  { number: 9, key: 'proposal.step9.benefits', title: 'Benefícios e ROI Esperado' },
  { number: 10, key: 'proposal.step10.assumptions', title: 'Premissas e Responsabilidades' },
] as const

export interface ProposalContext {
  meeting: {
    id: string
    date: string
    fileName?: string | null
  }
  client: {
    name: string
    company?: string | null
    leadName?: string | null
    phone?: string | null
    email?: string | null
  }
  closer: {
    name: string
  }
  transcript: string
  report?: {
    overallScore: number
    summary: string
    criteria: any[]
    actionPlan: any[]
    commitments?: {
      closer_actions?: any[]
      lead_actions?: any[]
    }
  } | null
  previousSteps: Record<number, { finalText?: string | null }>
}

export async function buildProposalContext(meetingId: string): Promise<ProposalContext> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      client: true,
      closer: true,
      report: true,
    },
  })

  if (!meeting) {
    throw new Error('Meeting não encontrado')
  }

  // Buscar proposta e steps anteriores
  // Incluir steps aprovados E também o Step 2 se tiver finalText (mesmo sem aprovação)
  const proposal = await prisma.proposal.findUnique({
    where: { meetingId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  })

  const previousSteps: Record<number, { finalText?: string | null }> = {}
  if (proposal) {
    proposal.steps.forEach((step) => {
      // Incluir se estiver aprovado OU se for Step 2 com finalText (versão ampliada)
      if (step.approvedAt || (step.stepNumber === 2 && step.finalText)) {
        previousSteps[step.stepNumber] = { finalText: step.finalText }
      }
    })
  }

  let reportData = null
  if (meeting.report) {
    try {
      const insights = JSON.parse(meeting.report.insights)
      const criteria = JSON.parse(meeting.report.criteriaScores)
      reportData = {
        overallScore: meeting.report.overallScore,
        summary: insights.summary || '',
        criteria,
        actionPlan: insights.action_plan || [],
        commitments: insights.commitments || null,
      }
    } catch (e) {
      console.error('Erro ao parsear report:', e)
    }
  }

  return {
    meeting: {
      id: meeting.id,
      date: meeting.createdAt.toISOString(),
      fileName: meeting.fileName,
    },
    client: {
      name: meeting.client.name,
      company: meeting.client.company,
      leadName: meeting.client.leadName,
      phone: meeting.client.phone,
      email: meeting.client.email,
    },
    closer: {
      name: meeting.closer.name,
    },
    transcript: meeting.transcript,
    report: reportData,
    previousSteps,
  }
}

export function replacePlaceholders(template: string, context: ProposalContext, stepData?: {
  closerNotes?: string | null
  closerAnswers?: string | null
  questionsJson?: string | null
}): string {
  let result = template

  // Placeholders básicos
  result = result.replace(/\{\{TRANSCRIPT\}\}/g, context.transcript)
  result = result.replace(/\{\{CLIENT_NAME\}\}/g, context.client.name)
  result = result.replace(/\{\{CLIENT_COMPANY\}\}/g, context.client.company || 'N/A')
  result = result.replace(/\{\{CLIENT_LEAD_NAME\}\}/g, context.client.leadName || 'N/A')
  result = result.replace(/\{\{CLIENT_PHONE\}\}/g, context.client.phone || 'N/A')
  result = result.replace(/\{\{CLIENT_EMAIL\}\}/g, context.client.email || 'N/A')
  result = result.replace(/\{\{CLOSER_NAME\}\}/g, context.closer.name)
  result = result.replace(/\{\{MEETING_DATE\}\}/g, new Date(context.meeting.date).toLocaleDateString('pt-BR'))
  result = result.replace(/\{\{MEETING_ID\}\}/g, context.meeting.id)

  // Report JSON
  if (context.report) {
    result = result.replace(/\{\{REPORT_JSON\}\}/g, JSON.stringify(context.report, null, 2))
    result = result.replace(/\{\{REPORT_SUMMARY\}\}/g, context.report.summary || '')
    result = result.replace(/\{\{REPORT_SCORE\}\}/g, context.report.overallScore.toString())
  } else {
    result = result.replace(/\{\{REPORT_JSON\}\}/g, '{}')
    result = result.replace(/\{\{REPORT_SUMMARY\}\}/g, 'N/A')
    result = result.replace(/\{\{REPORT_SCORE\}\}/g, 'N/A')
  }

  // Remover condicionais de template (não suportados, mas deixar compatível)
  result = result.replace(/\{\{#if REPORT_JSON\}\}/g, '')
  result = result.replace(/\{\{\/if\}\}/g, '')

  // Steps anteriores (substituir STEP1_OUTPUT, STEP2_OUTPUT, etc.)
  Object.entries(context.previousSteps).forEach(([stepNum, step]) => {
    const key = `STEP${stepNum}_OUTPUT`
    // Substituir placeholder específico do step
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), step.finalText || '')
  })

  // Step output anterior genérico (último step aprovado)
  const previousStepNumbers = Object.keys(context.previousSteps).map(Number).sort((a, b) => b - a)
  if (previousStepNumbers.length > 0) {
    const lastStep = context.previousSteps[previousStepNumbers[0]]
    result = result.replace(/\{\{STEP_OUTPUT_PREV\}\}/g, lastStep.finalText || '')
  } else {
    result = result.replace(/\{\{STEP_OUTPUT_PREV\}\}/g, '')
  }

  // Garantir que STEP2_OUTPUT esteja disponível mesmo se não aprovado ainda (usar finalText ou initialText)
  // Isso é importante porque o Step 2 pode não estar aprovado mas seu conteúdo já foi gerado
  if (!context.previousSteps[2] && stepData?.questionsJson) {
    // Se não tem STEP2_OUTPUT mas tem questionsJson, pode ser que ainda não foi aprovado
    // Neste caso, vamos usar o finalText se existir
  }

  // Dados do step atual
  if (stepData) {
    result = result.replace(/\{\{CLOSER_NOTES\}\}/g, stepData.closerNotes || '')
    result = result.replace(/\{\{CLOSER_ANSWERS\}\}/g, stepData.closerAnswers || '')
    result = result.replace(/\{\{QUESTIONS_JSON\}\}/g, stepData.questionsJson || '[]')
  } else {
    result = result.replace(/\{\{CLOSER_NOTES\}\}/g, '')
    result = result.replace(/\{\{CLOSER_ANSWERS\}\}/g, '')
    result = result.replace(/\{\{QUESTIONS_JSON\}\}/g, '[]')
  }

  return result
}
