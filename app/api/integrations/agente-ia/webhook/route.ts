import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  if (value && typeof value === 'object') return value as UnknownRecord
  return {}
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }
  return ''
}

function normalizeText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) {
    const lines = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
    return lines.join('\n')
  }
  return ''
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, '_')
}

export async function POST(request: NextRequest) {
  try {
    const configuredToken = process.env.AGENTE_IA_WEBHOOK_TOKEN
    const tokenFromHeader = request.headers.get('x-webhook-token') || ''

    if (configuredToken && tokenFromHeader !== configuredToken) {
      return NextResponse.json(
        { error: 'Token de webhook inválido' },
        { status: 401 }
      )
    }

    const payload = (await request.json()) as UnknownRecord
    const meeting = asRecord(payload.meeting)
    const notes = asRecord(payload.notes)

    const externalMeetingId = pickString(
      payload.meetingId,
      payload.meeting_id,
      payload.id,
      meeting.id
    )

    const meetingTitle = pickString(
      payload.title,
      payload.meetingTitle,
      payload.meeting_title,
      meeting.title,
      'meeting'
    )

    const transcript = pickString(
      payload.transcript,
      notes.transcript,
      payload.fullTranscript
    )

    const summary = pickString(payload.summary, notes.summary)
    const chapters = normalizeText(payload.chapters || notes.chapters)
    const topics = normalizeText(payload.topics || notes.topics)
    const actionItems = normalizeText(payload.actionItems || payload.action_items || notes.actionItems || notes.action_items)
    const keyQuestions = normalizeText(payload.keyQuestions || payload.key_questions || notes.keyQuestions || notes.key_questions)

    const transcriptToSave = transcript || [summary, chapters, topics, actionItems, keyQuestions].filter(Boolean).join('\n\n')
    if (!transcriptToSave) {
      return NextResponse.json(
        { error: 'Payload sem transcrição/notas para salvar' },
        { status: 400 }
      )
    }

    const clientIdFromPayload = pickString(payload.clientId, payload.client_id)
    const closerIdFromPayload = pickString(payload.closerId, payload.closer_id)

    const client = clientIdFromPayload
      ? await prisma.client.findUnique({ where: { id: clientIdFromPayload } })
      : await prisma.client.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } })

    const closer = closerIdFromPayload
      ? await prisma.closer.findUnique({ where: { id: closerIdFromPayload } })
      : await prisma.closer.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } })

    if (!client || !closer) {
      return NextResponse.json(
        {
          error: 'Não foi possível salvar: cliente/closer não encontrado',
          hint: 'Envie clientId e closerId no payload ou cadastre ao menos um cliente e um closer ativos.',
        },
        { status: 400 }
      )
    }

    const timestamp = new Date()
    const safeId = sanitizeFileName(externalMeetingId || `${Date.now()}`)
    const fileName = `${sanitizeFileName(meetingTitle)}_${safeId}.txt`

    const meetingCreated = await prisma.meeting.create({
      data: {
        clientId: client.id,
        closerId: closer.id,
        transcript: transcriptToSave,
        fileName,
      },
    })

    // Backup bruto local em JSON para auditoria/reprocessamento.
    const backupDir = path.join(process.cwd(), 'data', 'webhooks', 'agente-ia')
    await mkdir(backupDir, { recursive: true })
    const backupName = `${timestamp.toISOString().replace(/[:.]/g, '-')}_${safeId}.json`
    const backupPath = path.join(backupDir, backupName)
    await writeFile(
      backupPath,
      JSON.stringify(
        {
          receivedAt: timestamp.toISOString(),
          externalMeetingId,
          meetingId: meetingCreated.id,
          payload,
        },
        null,
        2
      ),
      'utf-8'
    )

    return NextResponse.json({
      success: true,
      message: 'Transcrição recebida e salva com sucesso',
      meetingId: meetingCreated.id,
      backupFile: path.relative(process.cwd(), backupPath),
    })
  } catch (error: any) {
    console.error('Erro no webhook Agente IA:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar webhook',
        details: error?.message || 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
