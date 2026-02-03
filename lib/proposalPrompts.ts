import OpenAI from 'openai'
import { prisma } from './prisma'
import { buildProposalContext, replacePlaceholders, PROPOSAL_STEPS } from './proposal'

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || 
                 process.env.NEXT_PUBLIC_OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não está configurada')
  }

  return new OpenAI({ apiKey })
}

export async function generateProposalStep(
  proposalId: string,
  stepNumber: number,
  stepData?: {
    closerNotes?: string | null
    closerAnswers?: string | null
    questionsJson?: string | null
  }
) {
  const step = PROPOSAL_STEPS.find(s => s.number === stepNumber)
  if (!step) {
    throw new Error(`Step ${stepNumber} não encontrado`)
  }

  // Buscar proposta e meeting
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      meeting: {
        include: {
          client: true,
          closer: true,
          report: true,
        },
      },
    },
  })

  if (!proposal) {
    throw new Error('Proposta não encontrada')
  }

  // Buscar template do step
  const template = await prisma.promptTemplate.findFirst({
    where: {
      category: 'proposal',
      stepKey: step.key,
      active: true,
    },
  })

  if (!template) {
    throw new Error(`Template não encontrado para ${step.key}. Configure em /propostas/configuracoes`)
  }

  // Buscar config do modelo (tentar módulo proposal primeiro, senão padrão)
  let modelConfig = await prisma.modelConfig.findFirst({
    where: {
      active: true,
      // Poderia filtrar por módulo se adicionar campo, mas por enquanto usa o ativo
    },
  })

  if (!modelConfig) {
    throw new Error('Configuração do modelo não encontrada')
  }

  // Construir contexto
  const context = await buildProposalContext(proposal.meetingId)

  // Substituir placeholders
  const prompt = replacePlaceholders(template.content, context, stepData)

  // Chamar OpenAI
  const openai = getOpenAIClient()
  const isGPT5 = modelConfig.model.startsWith('gpt-5')
  const useMaxCompletionTokens = isGPT5

  const requestOptions: any = {
    model: modelConfig.model,
    messages: [
      {
        role: 'system',
        content: 'Você é um assistente especializado em criar propostas comerciais profissionais e detalhadas.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  }

  // Configurar parâmetros baseado no modelo
  if (isGPT5) {
    if (modelConfig.reasoningEffort && modelConfig.reasoningEffort !== 'none') {
      requestOptions.reasoning_effort = modelConfig.reasoningEffort
    }
    if (modelConfig.verbosity) {
      requestOptions.verbosity = modelConfig.verbosity
    }
    if (useMaxCompletionTokens) {
      requestOptions.max_completion_tokens = modelConfig.maxTokens
    }
  } else {
    if (modelConfig.temperature != null) {
      requestOptions.temperature = modelConfig.temperature
    }
    if (modelConfig.topP != null) {
      requestOptions.top_p = modelConfig.topP
    }
    requestOptions.max_tokens = modelConfig.maxTokens
  }

  // Para step 2, forçar JSON mode
  if (stepNumber === 2 && !stepData?.questionsJson) {
    requestOptions.response_format = { type: 'json_object' }
  }

  const completion = await openai.chat.completions.create(requestOptions)

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('Resposta vazia da API do OpenAI')
  }

  // Para step 2 (perguntas), validar JSON
  if (stepNumber === 2 && !stepData?.questionsJson) {
    try {
      const parsed = JSON.parse(content)
      // Validar estrutura esperada
      if (!Array.isArray(parsed.questions) && !Array.isArray(parsed)) {
        // Tentar reparar: pedir JSON válido novamente
        const repairPrompt = `${prompt}\n\nIMPORTANTE: Retorne APENAS um JSON válido com um array de objetos. Cada objeto deve ter: id, pergunta, por_que_importa, exemplo_resposta.`
        const repairCompletion = await openai.chat.completions.create({
          ...requestOptions,
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente especializado em criar propostas comerciais profissionais e detalhadas.',
            },
            {
              role: 'user',
              content: repairPrompt,
            },
          ],
        })
        const repairContent = repairCompletion.choices[0]?.message?.content
        if (repairContent) {
          const repaired = JSON.parse(repairContent)
          return {
            questionsJson: JSON.stringify(Array.isArray(repaired.questions) ? repaired.questions : repaired),
            initialText: null,
          }
        }
      }
      return {
        questionsJson: JSON.stringify(Array.isArray(parsed.questions) ? parsed.questions : parsed),
        initialText: null,
      }
    } catch (e) {
      console.error('Erro ao parsear JSON de perguntas:', e)
      throw new Error('Resposta da IA não é um JSON válido. Tente novamente.')
    }
  }

  // Para outros steps ou reprocessamento, retornar texto
  return {
    initialText: content,
    questionsJson: null,
  }
}
