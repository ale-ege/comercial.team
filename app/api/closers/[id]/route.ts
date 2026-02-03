import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCloserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const closer = await prisma.closer.findUnique({
      where: { id: params.id },
    })

    if (!closer) {
      return NextResponse.json(
        { error: 'Closer não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ closer })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar closer', details: error.message },
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
    const data = updateCloserSchema.parse(body)

    const closer = await prisma.closer.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ closer })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao atualizar closer', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.closer.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao deletar closer', details: error.message },
      { status: 500 }
    )
  }
}