import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { z } from 'zod'

const questionSchema = z.object({
  question: z.string().min(1, 'Pergunta é obrigatória'),
})

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || 
                 process.env.NEXT_PUBLIC_OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não está configurada')
  }

  return new OpenAI({
    apiKey: apiKey,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { question } = questionSchema.parse(body)

    // Buscar relatório com transcrição
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        meeting: {
          include: {
            client: true,
            closer: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      )
    }

    if (!report.meeting.transcript) {
      return NextResponse.json(
        { error: 'Transcrição não encontrada para este relatório' },
        { status: 404 }
      )
    }

    // Buscar configuração do modelo
    const modelConfig = await prisma.modelConfig.findFirst({
      where: { active: true },
    })

    const model = modelConfig?.model || 'gpt-5.2'
    const isGPT5 = model.startsWith('gpt-5')

    // Construir prompt para análise da pergunta
    const prompt = `Você é um analista especializado em avaliação de reuniões de vendas técnicas.

Contexto da Reunião:
- Cliente: ${report.meeting.client.name}${report.meeting.client.company ? ` (${report.meeting.client.company})` : ''}
- Closer: ${report.meeting.closer.name}
- Data: ${new Date(report.meeting.createdAt).toLocaleDateString('pt-BR')}

Transcrição Completa da Reunião:
"""
${report.meeting.transcript}
"""

Análise do Relatório:
- Nota Geral: ${report.overallScore.toFixed(1)}/100
- Resumo: ${JSON.parse(report.insights).summary || 'N/A'}

Pergunta do Usuário:
"${question}"

Instruções:
1. Analise a transcrição completa da reunião para responder à pergunta do usuário
2. Use informações específicas da transcrição para fundamentar sua resposta
3. Seja objetivo e preciso, citando trechos relevantes quando apropriado
4. Se a pergunta não puder ser respondida com base na transcrição, indique isso claramente
5. Responda em português brasileiro de forma clara e profissional

Resposta:`

    // Configurar parâmetros da API
    const completionParams: any = {
      model,
      messages: [
        {
          role: 'system',
          content: 'Você é um analista especializado em avaliação de reuniões de vendas técnicas. Responda de forma clara, objetiva e fundamentada na transcrição fornecida.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }

    // Configurar tokens baseado no modelo
    if (isGPT5) {
      completionParams.max_completion_tokens = modelConfig?.maxTokens || 4000
      if (modelConfig?.reasoningEffort && modelConfig.reasoningEffort !== 'none') {
        completionParams.reasoning_effort = modelConfig.reasoningEffort
      }
      if (modelConfig?.verbosity && modelConfig.verbosity !== 'medium') {
        completionParams.verbosity = modelConfig.verbosity
      }
      if (!modelConfig?.reasoningEffort || modelConfig.reasoningEffort === 'none') {
        completionParams.temperature = modelConfig?.temperature ?? 0.7
        completionParams.top_p = modelConfig?.topP ?? 1.0
      }
    } else {
      completionParams.max_tokens = modelConfig?.maxTokens || 2000
      completionParams.temperature = modelConfig?.temperature || 0.7
      completionParams.top_p = modelConfig?.topP || 1.0
    }

    // Chamar API do OpenAI
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create(completionParams)

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('Resposta da API não contém choices')
    }

    const answer = completion.choices[0].message?.content

    if (!answer || answer.trim().length === 0) {
      throw new Error('Resposta vazia da API do OpenAI')
    }

    return NextResponse.json({
      success: true,
      answer: answer.trim(),
      question,
    })
  } catch (error: any) {
    console.error('Erro ao processar pergunta:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Erro de validação',
          details: error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      )
    }

    if (error.message?.includes('API key') || error.message?.includes('invalid_api_key')) {
      return NextResponse.json(
        {
          error: 'Chave da API do OpenAI inválida ou não configurada',
          details: 'Verifique se a OPENAI_API_KEY está correta no arquivo .env',
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao processar pergunta', details: error.message },
      { status: 500 }
    )
  }
}
