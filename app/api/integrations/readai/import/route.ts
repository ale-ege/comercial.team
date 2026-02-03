import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Importação manual de reuniões do Read.ai
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { importAll = false, limit = 50 } = body

    const config = await prisma.readAiIntegration.findFirst({
      where: { enabled: true },
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Integração Read.ai não está habilitada' },
        { status: 400 }
      )
    }

    // Atualizar status da sincronização
    await prisma.readAiIntegration.update({
      where: { id: config.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'processing',
        lastSyncError: null,
      },
    })

    // TODO: Implementar chamada à API do Read.ai para buscar reuniões
    // Por enquanto, vamos simular ou usar webhook apenas
    // Quando implementar, usar a API do Read.ai para listar reuniões:
    // - Se importAll = true e importAllOnFirstSync = true: buscar todas
    // - Caso contrário: buscar apenas novas (comparar com readAiMeetingId já importados)

    const importedMeetings = await prisma.readAiImport.findMany({
      where: {
        integrationId: config.id,
        status: 'completed',
      },
      select: {
        readAiMeetingId: true,
      },
    })

    const importedIds = new Set(importedMeetings.map((m) => m.readAiMeetingId))

    // Simular busca de reuniões (substituir por chamada real à API do Read.ai)
    const mockMeetings: any[] = []
    
    // TODO: Substituir por chamada real:
    // const readAiMeetings = await fetchReadAiMeetings(config.apiKey, {
    //   limit: importAll ? undefined : limit,
    //   since: config.lastSyncAt || undefined,
    // })

    const results = {
      total: mockMeetings.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[],
      message: mockMeetings.length === 0
        ? 'A importação manual ainda não está conectada à API do Read.ai. Configure o webhook no Read.ai (URL acima) para receber transcrições automaticamente quando as reuniões forem processadas.'
        : undefined,
    }

    // Processar cada reunião
    for (const meeting of mockMeetings) {
      const readAiMeetingId = String(meeting.id || meeting.meeting_id)

      // Se já foi importado e não é importAll, pular
      if (!importAll && importedIds.has(readAiMeetingId)) {
        results.skipped++
        continue
      }

      try {
        // Criar registro de importação
        const importRecord = await prisma.readAiImport.create({
          data: {
            integrationId: config.id,
            readAiMeetingId,
            status: 'processing',
            rawData: JSON.stringify(meeting),
          },
        })

        // Processar importação (mesma lógica do webhook)
        // Por enquanto, vamos apenas criar o registro
        // A lógica completa de processamento pode ser reutilizada

        results.imported++
        results.details.push({
          readAiMeetingId,
          status: 'processing',
          importId: importRecord.id,
        })
      } catch (error: any) {
        console.error('❌ Erro ao importar reunião:', readAiMeetingId, error)
        results.errors++
        results.details.push({
          readAiMeetingId,
          status: 'error',
          error: error.message,
        })
      }
    }

    // Atualizar status final
    await prisma.readAiIntegration.update({
      where: { id: config.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: results.errors > 0 ? 'partial' : 'success',
        lastSyncError: results.errors > 0 ? `${results.errors} erros durante importação` : null,
      },
    })

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: any) {
    console.error('❌ Erro ao importar reuniões:', error)
    
    // Atualizar status com erro
    const config = await prisma.readAiIntegration.findFirst()
    if (config) {
      await prisma.readAiIntegration.update({
        where: { id: config.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'error',
          lastSyncError: error.message,
        },
      })
    }

    return NextResponse.json(
      { error: 'Erro ao importar reuniões', details: error.message },
      { status: 500 }
    )
  }
}
