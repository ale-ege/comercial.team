import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        closer: true,
      },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: meeting.id,
      transcript: meeting.transcript,
      fileName: meeting.fileName,
      client: meeting.client,
      closer: meeting.closer,
      createdAt: meeting.createdAt,
    })
  } catch (error: any) {
    console.error('Erro ao buscar reunião:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar reunião', details: error.message },
      { status: 500 }
    )
  }
}

const updateMeetingSchema = z.object({
  closerId: z.string().optional(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  clientCompany: z.string().optional().nullable(),
  closerName: z.string().optional(),
  createdAt: z.string().optional(), // ISO string
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateMeetingSchema.parse(body)

    // Buscar o meeting atual
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        closer: true,
      },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar cliente se necessário
    let clientId = meeting.clientId
    if (data.clientId) {
      clientId = data.clientId
    } else if (data.clientName || data.clientCompany !== undefined) {
      // Se mudou nome ou empresa, atualizar o cliente existente
      await prisma.client.update({
        where: { id: meeting.clientId },
        data: {
          ...(data.clientName && { name: data.clientName }),
          ...(data.clientCompany !== undefined && { company: data.clientCompany || null }),
        },
      })
    }

    // Atualizar closer se necessário
    let closerId = meeting.closerId
    if (data.closerId) {
      closerId = data.closerId
    } else if (data.closerName) {
      // Se mudou nome, atualizar o closer existente
      await prisma.closer.update({
        where: { id: meeting.closerId },
        data: {
          name: data.closerName,
        },
      })
    }

    // Preparar dados para atualizar o meeting
    const updateData: any = {}
    
    if (clientId !== meeting.clientId) {
      updateData.clientId = clientId
    }
    
    if (closerId !== meeting.closerId) {
      updateData.closerId = closerId
    }
    
    if (data.createdAt) {
      updateData.createdAt = new Date(data.createdAt)
    }

    // Atualizar meeting se houver mudanças
    if (Object.keys(updateData).length > 0) {
      await prisma.meeting.update({
        where: { id: params.id },
        data: updateData,
      })
    }

    // Buscar dados atualizados
    const updatedMeeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        closer: true,
      },
    })

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
    })
  } catch (error: any) {
    console.error('Erro ao atualizar reunião:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar reunião', details: error.message },
      { status: 500 }
    )
  }
}
