import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const closerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  active: z.boolean().optional(),
})

export async function GET() {
  try {
    const closers = await prisma.closer.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ closers })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar closers', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = closerSchema.parse(body)

    const closer = await prisma.closer.create({
      data: {
        name: data.name,
        email: data.email || null,
        active: data.active ?? true,
      },
    })

    return NextResponse.json({ closer })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao criar closer', details: error.message },
      { status: 500 }
    )
  }
}