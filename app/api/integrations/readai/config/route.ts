import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const configSchema = z.object({
  enabled: z.boolean().optional(),
  autoImport: z.boolean().optional(),
  importSchedule: z.string().optional().nullable(),
  importAllOnFirstSync: z.boolean().optional(),
})

function getWebhookBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    const url = process.env.NEXT_PUBLIC_BASE_URL.trim()
    return url.startsWith('http') ? url : `https://${url}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

function ensureWebhookUrl(config: { id: string; webhookUrl: string | null }) {
  if (config.webhookUrl) return config
  const baseUrl = getWebhookBaseUrl()
  const webhookSecret = `readai_${Date.now()}_${Math.random().toString(36).substring(7)}`
  return prisma.readAiIntegration.update({
    where: { id: config.id },
    data: {
      webhookUrl: `${baseUrl}/api/integrations/readai/webhook`,
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

    // Garantir que a URL do webhook exista (gerar se estiver vazia)
    if (!config.webhookUrl) {
      config = await ensureWebhookUrl(config)
    }

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
        },
      })
    }

    // Gerar URL do webhook se não existir
    if (!config.webhookUrl) {
      config = await ensureWebhookUrl(config)
    }

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
