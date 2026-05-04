import { NextRequest, NextResponse } from 'next/server'
import type { ReadAiIntegration } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const configSchema = z.object({
  enabled: z.boolean().optional(),
  autoImport: z.boolean().optional(),
  importSchedule: z.string().optional().nullable(),
  importAllOnFirstSync: z.boolean().optional(),
  webhookUrl: z.string().optional().nullable(),
})

function getWebhookBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    const url = process.env.NEXT_PUBLIC_BASE_URL.trim()
    return url.startsWith('http') ? url : `https://${url}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // Fallback para ambiente local com túnel público (Read.ai precisa de URL pública)
  return 'https://unstentoriously-imperturbably-sabina.ngrok-free.dev'
}

async function ensureWebhookUrl(
  config: ReadAiIntegration
): Promise<ReadAiIntegration> {
  const baseUrl = getWebhookBaseUrl()
  const expectedWebhookUrl = `${baseUrl}/api/integrations/readai/webhook`

  // Não sobrescrever URL customizada definida manualmente pelo usuário
  if (config.webhookUrl && config.webhookUrl !== expectedWebhookUrl) return config
  if (config.webhookUrl === expectedWebhookUrl) return config

  const webhookSecret = `readai_${Date.now()}_${Math.random().toString(36).substring(7)}`
  return prisma.readAiIntegration.update({
    where: { id: config.id },
    data: {
      webhookUrl: expectedWebhookUrl,
      webhookSecret,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    let config = await prisma.readAiIntegration.findFirst()

    if (!config) {
      config = await prisma.readAiIntegration.create({
        data: {
          enabled: false,
          autoImport: false,
          importAllOnFirstSync: true,
        },
      })
    }

    // Garantir que a URL do webhook exista e esteja atualizada
    config = await ensureWebhookUrl(config)

    return NextResponse.json({
      config: {
        id: config.id,
        enabled: config.enabled,
        autoImport: config.autoImport,
        importSchedule: config.importSchedule,
        importAllOnFirstSync: config.importAllOnFirstSync,
        webhookUrl: config.webhookUrl,
        lastSyncAt: config.lastSyncAt,
        lastSyncStatus: config.lastSyncStatus,
        lastSyncError: config.lastSyncError,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar configuração Read.ai:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuração', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const data = configSchema.parse(body)

    let config = await prisma.readAiIntegration.findFirst()

    if (!config) {
      config = await prisma.readAiIntegration.create({
        data: {
          enabled: data.enabled ?? false,
          autoImport: data.autoImport ?? false,
          importSchedule: data.importSchedule || null,
          importAllOnFirstSync: data.importAllOnFirstSync ?? true,
        },
      })
    } else {
      config = await prisma.readAiIntegration.update({
        where: { id: config.id },
        data: {
          enabled: data.enabled !== undefined ? data.enabled : config.enabled,
          autoImport: data.autoImport !== undefined ? data.autoImport : config.autoImport,
          importSchedule: data.importSchedule !== undefined ? data.importSchedule : config.importSchedule,
          importAllOnFirstSync: data.importAllOnFirstSync !== undefined ? data.importAllOnFirstSync : config.importAllOnFirstSync,
          webhookUrl: data.webhookUrl !== undefined ? (data.webhookUrl || null) : config.webhookUrl,
        },
      })
    }

    // Garantir URL atualizada conforme base URL atual
    config = await ensureWebhookUrl(config)

    return NextResponse.json({
      config: {
        id: config.id,
        enabled: config.enabled,
        autoImport: config.autoImport,
        importSchedule: config.importSchedule,
        importAllOnFirstSync: config.importAllOnFirstSync,
        webhookUrl: config.webhookUrl,
        lastSyncAt: config.lastSyncAt,
        lastSyncStatus: config.lastSyncStatus,
        lastSyncError: config.lastSyncError,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao atualizar configuração Read.ai:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Erro de validação',
          details: error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar configuração', details: error.message },
      { status: 500 }
    )
  }
}
