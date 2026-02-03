import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const optionalStringToNull = z
  .union([z.string(), z.undefined()])
  .transform((val) => (val === '' || val == null ? null : val))
  .nullable()

const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: optionalStringToNull.refine(
    (val) => val === null || z.string().email().safeParse(val).success,
    { message: 'Email inválido' }
  ),
  company: optionalStringToNull,
  phone: optionalStringToNull,
  leadName: optionalStringToNull,
  active: z.boolean().optional(),
})

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ clients })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar clientes', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = clientSchema.parse(body)

    // Zod já converte strings vazias em null
    const client = await prisma.client.create({
      data: {
        name: data.name.trim(),
        email: data.email,
        company: data.company,
        phone: data.phone,
        leadName: data.leadName,
        active: data.active ?? true,
      },
    })

    return NextResponse.json({ client })
  } catch (error: any) {
    console.error('❌ Erro ao criar cliente:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
    })
    return NextResponse.json(
      { error: 'Erro ao criar cliente', details: error.message },
      { status: 500 }
    )
  }
}