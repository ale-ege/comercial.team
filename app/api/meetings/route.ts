import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMeetingSchema = z.object({
  clientId: z.string(),
  closerId: z.string(),
  transcript: z.string().min(1),
  fileName: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createMeetingSchema.parse(body)

    // Verificar se cliente e closer existem
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    })
    const closer = await prisma.closer.findUnique({
      where: { id: data.closerId },
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

    // Criar meeting
    const meeting = await prisma.meeting.create({
      data: {
        clientId: data.clientId,
        closerId: data.closerId,
        transcript: data.transcript,
        fileName: data.fileName || null,
      },
      include: {
        client: true,
        closer: true,
      },
    })

    return NextResponse.json({
      success: true,
      meeting,
    })
  } catch (error: any) {
    console.error('Erro ao criar meeting:', error)
    return NextResponse.json(
      { error: 'Erro ao criar meeting', details: error.message },
      { status: 500 }
    )
  }
}
