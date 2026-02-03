import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const criterionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().min(0).max(5),
  examples: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
  goodExamples: z.string().optional().nullable(),
  badExamples: z.string().optional().nullable(),
  active: z.boolean().optional(),
})

export async function GET() {
  try {
    const criteria = await prisma.criterion.findMany({
      orderBy: { name: 'asc' },
    })

    const formatted = criteria.map((c) => ({
      ...c,
      examples: JSON.parse(c.examples || '[]'),
      rules: JSON.parse(c.rules || '[]'),
    }))

    return NextResponse.json({ criteria: formatted })
  } catch (error: any) {
    console.error('❌ Erro ao buscar critérios:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
    })
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar critérios', 
        details: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        }),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📥 Dados recebidos para criar critério:', JSON.stringify(body, null, 2))
    
    const data = criterionSchema.parse(body)
    console.log('✅ Dados validados:', JSON.stringify(data, null, 2))

    const criterion = await prisma.criterion.create({
      data: {
        name: data.name,
        description: data.description,
        weight: data.weight,
        examples: JSON.stringify(data.examples || []),
        rules: JSON.stringify(data.rules || []),
        goodExamples: data.goodExamples || null,
        badExamples: data.badExamples || null,
        active: data.active ?? true,
      },
    })

    console.log('✅ Critério criado:', criterion.id)

    return NextResponse.json({
      criterion: {
        ...criterion,
        examples: JSON.parse(criterion.examples || '[]'),
        rules: JSON.parse(criterion.rules || '[]'),
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao criar critério:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
    })
    
    return NextResponse.json(
      { 
        error: 'Erro ao criar critério', 
        details: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        }),
      },
      { status: 500 }
    )
  }
}