import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeTranscript } from '@/lib/openai'
import { analyzeRequestSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = analyzeRequestSchema.parse(body)

    // Buscar cliente e closer
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId },
    })
    const closer = await prisma.closer.findUnique({
      where: { id: validatedData.closerId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    if (!closer) {
      return NextResponse.json(
        { error: 'Closer não encontrado' },
        { status: 404 }
      )
    }

    // Analisar transcrição
    const analysis = await analyzeTranscript(
      validatedData.transcript,
      client.name,
      closer.name
    )

    // Criar meeting
    const meeting = await prisma.meeting.create({
      data: {
        clientId: validatedData.clientId,
        closerId: validatedData.closerId,
        transcript: validatedData.transcript,
        fileName: validatedData.fileName || null,
      },
    })

    // Criar report
    const report = await prisma.report.create({
      data: {
        meetingId: meeting.id,
        overallScore: analysis.overall_score,
        criteriaScores: JSON.stringify(analysis.criteria),
        insights: JSON.stringify({
          summary: analysis.summary,
          action_plan: analysis.action_plan,
          commitments: analysis.commitments,
          metadata: analysis.metadata,
        }),
        rawModelOutput: analysis.rawContent,
      },
    })

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        meetingId: meeting.id,
        overallScore: report.overallScore,
        criteria: analysis.criteria,
        summary: analysis.summary,
        actionPlan: analysis.action_plan,
        metadata: analysis.metadata,
        chartData: analysis.chart_data,
      },
    })
  } catch (error: any) {
    console.error('Erro ao analisar transcrição:', error)
    console.error('Stack:', error.stack)
    
    // Tratar erros específicos da API do OpenAI
    if (error.message?.includes('API key') || error.message?.includes('invalid_api_key')) {
      return NextResponse.json(
        {
          error: 'Chave da API do OpenAI inválida ou não configurada',
          details: 'Verifique se a OPENAI_API_KEY está correta no arquivo .env e reinicie o servidor.',
          hint: 'A chave deve começar com "sk-" e ter pelo menos 20 caracteres.',
        },
        { status: 401 }
      )
    }
    
    // Tratar erros de validação Zod
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Erro de validação dos dados',
          details: error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      )
    }
    
    // Tratar erros do Prisma
    if (error.code?.startsWith('P')) {
      return NextResponse.json(
        {
          error: 'Erro no banco de dados',
          details: error.message,
        },
        { status: 500 }
      )
    }
    
    // Log completo do erro para debug
    console.error('❌ Erro completo:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
    })

    return NextResponse.json(
      {
        error: 'Erro ao analisar transcrição',
        details: error.message || 'Erro desconhecido',
        type: error.name || 'UnknownError',
        // Incluir mais detalhes em desenvolvimento
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        }),
      },
      { status: 500 }
    )
  }
}