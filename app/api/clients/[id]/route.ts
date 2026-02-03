import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .refine((val) => val === null || z.string().email().safeParse(val).success, {
      message: 'Email inválido',
    })
    .optional(),
  company: z.string().transform((val) => (val === '' ? null : val)).nullable().optional(),
  phone: z.string().transform((val) => (val === '' ? null : val)).nullable().optional(),
  leadName: z.string().transform((val) => (val === '' ? null : val)).nullable().optional(),
  active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ client })
  } catch (error: any) {
    console.error('❌ Erro ao buscar cliente:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      id: params.id,
    })
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar cliente', 
        details: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        }),
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateClientSchema.parse(body)

    // Zod já converte strings vazias em null
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.email !== undefined) updateData.email = data.email
    if (data.company !== undefined) updateData.company = data.company
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.leadName !== undefined) updateData.leadName = data.leadName
    if (data.active !== undefined) updateData.active = data.active

    const client = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ client })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.client.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao deletar cliente', details: error.message },
      { status: 500 }
    )
  }
}