import OpenAI from 'openai'
import { prisma } from './prisma'
import { analyzeResponseSchema } from './validations'

export function getOpenAIClient() {
  // Validar se a chave da API está configurada
  // Tentar múltiplas formas de ler a variável de ambiente
  const apiKey = process.env.OPENAI_API_KEY?.trim() || 
                 process.env.NEXT_PUBLIC_OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY não está configurada. Por favor, adicione sua chave da API do OpenAI no arquivo .env e reinicie o servidor.'
    )
  }

  // Log para debug (apenas primeiros e últimos caracteres por segurança)
  console.log('🔑 Chave da API detectada:', {
    length: apiKey.length,
    startsWith: apiKey.substring(0, 15),
    endsWith: '...' + apiKey.substring(apiKey.length - 4),
    isValidFormat: apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-'),
  })

  // Validar apenas placeholders muito específicos
  // Não bloquear chaves que começam com "sk-" ou "sk-proj-"
  const isPlaceholder = 
    apiKey === 'your-openai-api-key-here' ||
    apiKey === 'sk-your-openai-api-key-here' ||
    (apiKey.length < 20 && !apiKey.startsWith('sk-') && !apiKey.startsWith('sk-proj-'))
  
  if (isPlaceholder) {
    throw new Error(
      'OPENAI_API_KEY parece ser um placeholder. Por favor, adicione sua chave real da API do OpenAI no arquivo .env e reinicie o servidor.'
    )
  }

  return new OpenAI({
    apiKey: apiKey,
  })
}

export async function analyzeTranscript(
  transcript: string,
  clientName: string,
  closerName: string
) {
  console.log('📝 Iniciando análise de transcrição...')
  console.log('🔑 OPENAI_API_KEY presente:', !!process.env.OPENAI_API_KEY)
  console.log('🔑 OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0)
  
  // Buscar critérios ativos
  const criteria = await prisma.criterion.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
  
  console.log(`✅ ${criteria.length} critérios encontrados`)

  // Buscar prompt template ativo
  const promptTemplate = await prisma.promptTemplate.findFirst({
    where: { active: true },
  })

  if (!promptTemplate) {
    throw new Error('Nenhum prompt template ativo encontrado')
  }

  // Buscar configuração do modelo
  const modelConfig = await prisma.modelConfig.findFirst({
    where: { active: true },
  })

  // Montar lista de critérios para o prompt incluindo ID
  // IMPORTANTE: Incluir ID para garantir que a API use o ID correto
  const criteriaList = criteria
    .map(
      (c) => `
- ID: ${c.id} | Nome EXATO: "${c.name}" (Peso: ${c.weight})
  Descrição: ${c.description}
  Exemplos do que é bom: ${c.goodExamples || 'N/A'}
  Exemplos do que é ruim: ${c.badExamples || 'N/A'}
  Regras: ${JSON.parse(c.rules || '[]').join(', ')}`
    )
    .join('\n')
  
  // Criar mapa de critérios para matching rápido
  const criteriaMapById = new Map(criteria.map(c => [c.id, c]))
  const criteriaMapByName = new Map(criteria.map(c => [c.name.toLowerCase().trim(), c]))
  
  // Função para normalizar nome (para matching flexível)
  const normalizeName = (name: string): string => {
    if (!name) return ''
    return name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
      .trim()
  }
  
  // Função para extrair parte base do nome (antes dos parênteses)
  const getBaseName = (name: string): string => {
    if (!name) return ''
    const match = name.match(/^([^(]+)/)
    return match ? match[1].trim() : name.trim()
  }
  
  // Criar mapa por nome base normalizado (para matching mais flexível)
  const criteriaMapByBaseName = new Map<string, typeof criteria[0]>()
  criteria.forEach(c => {
    const baseName = getBaseName(c.name)
    const normalizedBase = normalizeName(baseName)
    if (!criteriaMapByBaseName.has(normalizedBase)) {
      criteriaMapByBaseName.set(normalizedBase, c)
    }
  })

  // Substituir placeholders no prompt
  let prompt = promptTemplate.content
    .replace('{{CRITERIA_LIST}}', criteriaList)
    .replace('{{TRANSCRIPT}}', transcript)
    .replace('{{CLIENT_NAME}}', clientName)
    .replace('{{CLOSER_NAME}}', closerName)

  // Chamar API do OpenAI
  const model = modelConfig?.model || 'gpt-5.2'
  const reasoningEffort = modelConfig?.reasoningEffort || 'none'
  const verbosity = modelConfig?.verbosity || 'medium'
  
  // Modelos GPT-5.2 usam Chat Completions API
  const isGPT5 = model.startsWith('gpt-5')
  
  const completionParams: any = {
    model,
    messages: [
      {
        role: 'system',
        content:
          'Você é um analista sênior especializado em avaliação de reuniões de vendas técnicas de soluções de IA para a indústria. Sempre retorne JSON válido e estrito conforme o formato especificado. IMPORTANTE: Retorne APENAS o JSON, sem texto adicional antes ou depois.',
      },
      {
        role: 'user',
        content: prompt + '\n\nIMPORTANTE: Retorne APENAS o JSON válido, sem nenhum texto adicional.',
      },
    ],
  }

  // GPT-5.2 usa max_completion_tokens, modelos antigos usam max_tokens
  // IMPORTANTE: max_completion_tokens inclui reasoning_tokens + completion_tokens
  // Para GPT-5.2, precisamos de tokens suficientes para raciocínio + resposta JSON
  // Recomendado: pelo menos 8000-10000 tokens para análises complexas
  if (isGPT5) {
    // Se reasoning_effort for 'none', pode usar menos tokens
    // Se for 'medium', 'high' ou 'xhigh', precisa de muito mais
    const baseTokens = modelConfig?.maxTokens || 8000
    completionParams.max_completion_tokens = baseTokens
  } else {
    completionParams.max_tokens = modelConfig?.maxTokens || 2000
  }

  // Parâmetros específicos do GPT-5.2
  if (isGPT5) {
    // Reasoning effort (none, low, medium, high, xhigh)
    // Para GPT-5.2, usar reasoning_effort no nível raiz
    if (reasoningEffort && reasoningEffort !== 'none') {
      completionParams.reasoning_effort = reasoningEffort
    }
    
    // Verbosity (low, medium, high) - parâmetro no nível raiz
    if (verbosity && verbosity !== 'medium') {
      completionParams.verbosity = verbosity
    }
    
    // Temperature e top_p apenas quando reasoning_effort = none
    // Se reasoning_effort não for 'none', não incluir temperature e top_p
    if (reasoningEffort === 'none' || !reasoningEffort) {
      if (modelConfig?.temperature !== undefined && modelConfig.temperature !== null) {
        completionParams.temperature = modelConfig.temperature
      } else {
        completionParams.temperature = 0.7
      }
      if (modelConfig?.topP !== undefined && modelConfig.topP !== null) {
        completionParams.top_p = modelConfig.topP
      } else {
        completionParams.top_p = 1.0
      }
    }
    // Se reasoning_effort for diferente de 'none', não incluir temperature/top_p
    
    // GPT-5.2 suporta response_format para JSON
    // Nota: Se houver problemas com resposta vazia, pode ser necessário remover isso temporariamente
    completionParams.response_format = { type: 'json_object' }
  } else {
    // Modelos mais antigos (gpt-4, gpt-3.5)
    const supportsJsonMode = (model.includes('gpt-4') || model.includes('gpt-3.5-turbo')) && !model.includes('o1')
    
    if (supportsJsonMode) {
      completionParams.response_format = { type: 'json_object' }
    }
    
    completionParams.temperature = modelConfig?.temperature || 0.7
    completionParams.top_p = modelConfig?.topP || 1.0
  }

  console.log('🤖 Chamando API do OpenAI...', {
    model: modelConfig?.model || 'gpt-5.2',
    reasoningEffort: reasoningEffort,
    verbosity: verbosity,
    transcriptLength: transcript.length,
  })

  const openai = getOpenAIClient()
  
  let completion
  try {
    console.log('⏳ Aguardando resposta da API...')
    console.log('📋 Parâmetros:', JSON.stringify({
      model: completionParams.model,
      reasoning_effort: completionParams.reasoning_effort,
      verbosity: completionParams.verbosity,
      temperature: completionParams.temperature,
      max_tokens: completionParams.max_tokens,
      max_completion_tokens: completionParams.max_completion_tokens,
    }, null, 2))
    
    completion = await openai.chat.completions.create(completionParams)
    console.log('✅ Resposta recebida da API')
    console.log('📦 Estrutura da resposta:', {
      hasChoices: !!completion.choices,
      choicesLength: completion.choices?.length || 0,
      firstChoice: completion.choices?.[0] ? {
        hasMessage: !!completion.choices[0].message,
        messageRole: completion.choices[0].message?.role,
        hasContent: !!completion.choices[0].message?.content,
        contentLength: completion.choices[0].message?.content?.length || 0,
        finishReason: completion.choices[0].finish_reason,
      } : null,
    })
  } catch (error: any) {
    // Tratar erros específicos da API
    if (error.code === 'invalid_api_key' || error.message?.includes('API key')) {
      throw new Error(
        'Chave da API do OpenAI inválida. Verifique se a OPENAI_API_KEY está correta no arquivo .env e reinicie o servidor.'
      )
    }
    throw error
  }

  // Verificar estrutura da resposta
  if (!completion.choices || completion.choices.length === 0) {
    console.error('❌ Resposta sem choices:', JSON.stringify(completion, null, 2))
    throw new Error('Resposta da API não contém choices')
  }

  const firstChoice = completion.choices[0]
  if (!firstChoice.message) {
    console.error('❌ Choice sem message:', JSON.stringify(firstChoice, null, 2))
    throw new Error('Resposta da API não contém message no choice')
  }

  let content = firstChoice.message.content
  
  // Verificar se o conteúdo está vazio ou null
  if (!content || content.trim().length === 0) {
    console.error('❌ Conteúdo vazio. Estrutura completa:', JSON.stringify({
      finish_reason: firstChoice.finish_reason,
      message: firstChoice.message,
      usage: completion.usage,
    }, null, 2))
    
    // Se finish_reason for diferente de 'stop', pode indicar um problema
    if (firstChoice.finish_reason) {
      if (firstChoice.finish_reason === 'length') {
        throw new Error(`Resposta truncada pela API. Finish reason: ${firstChoice.finish_reason}. Aumente max_completion_tokens (atual: ${completionParams.max_completion_tokens}).`)
      } else if (firstChoice.finish_reason !== 'stop') {
        throw new Error(`Resposta incompleta da API. Finish reason: ${firstChoice.finish_reason}. Verifique os logs para mais detalhes.`)
      }
    }
    
    throw new Error('Resposta vazia da API do OpenAI. Verifique os logs para mais detalhes.')
  }

  // Limpar o conteúdo (remover markdown code blocks se houver)
  content = content.trim()
  if (content.startsWith('```json')) {
    content = content.replace(/^```json\s*/, '').replace(/```\s*$/, '')
  } else if (content.startsWith('```')) {
    content = content.replace(/^```\s*/, '').replace(/```\s*$/, '')
  }

  // Parsear e validar JSON
  let parsedResponse
  try {
    parsedResponse = JSON.parse(content)
  } catch (error) {
    console.error('Conteúdo recebido:', content.substring(0, 500))
    throw new Error(`Erro ao parsear resposta JSON: ${error}. Conteúdo: ${content.substring(0, 200)}`)
  }

  // Validar estrutura básica
  if (!parsedResponse.overall_score && parsedResponse.overall_score !== 0) {
    throw new Error('Resposta da API não contém overall_score')
  }
  if (!parsedResponse.criteria || !Array.isArray(parsedResponse.criteria)) {
    throw new Error('Resposta da API não contém criteria como array')
  }
  if (!parsedResponse.summary) {
    throw new Error('Resposta da API não contém summary')
  }

  // Adicionar IDs aos critérios e garantir que usem os nomes exatos do banco
  if (parsedResponse.criteria && Array.isArray(parsedResponse.criteria)) {
    parsedResponse.criteria = parsedResponse.criteria.map((criterion: any, index: number) => {
      let matchingCriterion = null
      
      // Prioridade 1: Buscar por ID se fornecido
      if (criterion.id && criteriaMapById.has(criterion.id)) {
        matchingCriterion = criteriaMapById.get(criterion.id)!
      }
      // Prioridade 2: Buscar por nome exato
      else if (criterion.name && criteriaMapByName.has(criterion.name.toLowerCase().trim())) {
        matchingCriterion = criteriaMapByName.get(criterion.name.toLowerCase().trim())!
      }
      // Prioridade 3: Buscar por nome normalizado (matching flexível)
      else if (criterion.name) {
        const normalizedInput = normalizeName(criterion.name)
        matchingCriterion = criteria.find((c) => normalizeName(c.name) === normalizedInput)
      }
      
      // Se encontrou match, usar dados do banco (garantir consistência)
      if (matchingCriterion) {
        criterion.id = matchingCriterion.id
        criterion.name = matchingCriterion.name // FORÇAR uso do nome exato do banco
        criterion.weight = matchingCriterion.weight
      } else {
        // Se não encontrar, usar um ID temporário mas manter o nome original
        criterion.id = `temp-${index}`
        console.warn(`⚠️ Critério não encontrado no banco: "${criterion.name}". Usando ID temporário.`)
      }
      
      // Garantir que arrays existam
      if (!criterion.evidence_quotes) criterion.evidence_quotes = []
      if (!criterion.improvements) criterion.improvements = []
      if (!criterion.positives) criterion.positives = []
      // Garantir que weight exista
      if (!criterion.weight) criterion.weight = 1.0
      
      return criterion
    })
  }

  // Garantir que action_plan exista
  if (!parsedResponse.action_plan) {
    parsedResponse.action_plan = []
  }

  // Validar com Zod
  try {
    const validatedResponse = analyzeResponseSchema.parse(parsedResponse)

    return {
      ...validatedResponse,
      rawContent: content,
    }
  } catch (zodError: any) {
    console.error('Erro de validação Zod:', zodError.errors)
    console.error('Resposta recebida:', JSON.stringify(parsedResponse, null, 2))
    throw new Error(
      `Resposta da API não está no formato esperado: ${zodError.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
    )
  }
}