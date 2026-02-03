import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'

// Webhook do Read.ai recebe dados de reuniões
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📥 Webhook Read.ai recebido:', JSON.stringify(body, null, 2))

    // Buscar configuração da integração
    const config = await prisma.readAiIntegration.findFirst({
      where: { enabled: true },
    })

    if (!config) {
      console.warn('⚠️ Integração Read.ai não está habilitada')
      return NextResponse.json(
        { error: 'Integração não habilitada' },
        { status: 400 }
      )
    }

    // Validar webhook secret se fornecido
    const signature = request.headers.get('x-readai-signature')
    if (config.webhookSecret && signature) {
      const expectedSignature = createHmac('sha256', config.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex')
      
      if (signature !== expectedSignature) {
        console.warn('⚠️ Assinatura do webhook inválida')
        return NextResponse.json(
          { error: 'Assinatura inválida' },
          { status: 401 }
        )
      }
    }

    // Processar dados do webhook
    // Estrutura esperada do Read.ai (ajustar conforme documentação real)
    const readAiMeetingId = body.meeting_id || body.id || body.meetingId
    const transcript = body.transcript || body.summary || ''
    const meetingTitle = body.title || body.meeting_title || 'Reunião Read.ai'
    const meetingDate = body.date || body.meeting_date || new Date()
    const participants = body.participants || []

    if (!readAiMeetingId) {
      return NextResponse.json(
        { error: 'ID da reunião não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se já foi importado
    const existingImport = await prisma.readAiImport.findUnique({
      where: {
        integrationId_readAiMeetingId: {
          integrationId: config.id,
          readAiMeetingId: String(readAiMeetingId),
        },
      },
    })

    if (existingImport && existingImport.status === 'completed') {
      console.log('ℹ️ Reunião já importada:', readAiMeetingId)
      return NextResponse.json({
        success: true,
        message: 'Reunião já importada',
        importId: existingImport.id,
      })
    }

    // Criar registro de importação
    const importRecord = await prisma.readAiImport.create({
      data: {
        integrationId: config.id,
        readAiMeetingId: String(readAiMeetingId),
        status: 'processing',
        rawData: JSON.stringify(body),
      },
    })

    // Tentar identificar cliente e closer (pode ser feito via mapeamento ou IA)
    // Por enquanto, vamos criar um processo manual ou usar valores padrão
    // TODO: Implementar lógica de mapeamento inteligente

    // Processar importação em background (não bloquear resposta do webhook)
    processImportAsync(importRecord.id, {
      readAiMeetingId,
      transcript,
      meetingTitle,
      meetingDate,
      participants,
      rawData: body,
    }).catch((error) => {
      console.error('❌ Erro ao processar importação:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook recebido e processando',
      importId: importRecord.id,
    })
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook Read.ai:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: error.message },
      { status: 500 }
    )
  }
}

async function processImportAsync(importId: string, data: any) {
  try {
    // Buscar importação
    const importRecord = await prisma.readAiImport.findUnique({
      where: { id: importId },
    })

    if (!importRecord) {
      throw new Error('Importação não encontrada')
    }

    // TODO: Implementar lógica de mapeamento de cliente/closer
    // Por enquanto, vamos criar um placeholder ou usar valores padrão
    // Isso deve ser configurável na interface

    // Criar ou buscar cliente (pode ser feito via mapeamento de email/participantes)
    // Por enquanto, vamos criar um cliente genérico ou usar o primeiro cliente ativo
    const defaultClient = await prisma.client.findFirst({
      where: { active: true },
    })

    if (!defaultClient) {
      throw new Error('Nenhum cliente padrão encontrado. Crie um cliente primeiro.')
    }

    // Buscar closer padrão ou usar o primeiro ativo
    const defaultCloser = await prisma.closer.findFirst({
      where: { active: true },
    })

    if (!defaultCloser) {
      throw new Error('Nenhum closer padrão encontrado. Crie um closer primeiro.')
    }

    // Criar meeting
    const meeting = await prisma.meeting.create({
      data: {
        clientId: defaultClient.id,
        closerId: defaultCloser.id,
        transcript: data.transcript || 'Transcrição não disponível',
        fileName: `${data.meetingTitle || 'readai'}_${data.readAiMeetingId}.txt`,
      },
    })

    // Atualizar importação
    await prisma.readAiImport.update({
      where: { id: importId },
      data: {
        status: 'completed',
        meetingId: meeting.id,
      },
    })

    // Atualizar última sincronização
    await prisma.readAiIntegration.update({
      where: { id: importRecord.integrationId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      },
    })

    console.log('✅ Importação concluída:', importId, 'Meeting:', meeting.id)
  } catch (error: any) {
    console.error('❌ Erro ao processar importação:', error)
    
    // Atualizar importação com erro
    await prisma.readAiImport.update({
      where: { id: importId },
      data: {
        status: 'error',
        errorMessage: error.message,
      },
    })

    // Atualizar última sincronização com erro
    const importRecord = await prisma.readAiImport.findUnique({
      where: { id: importId },
    })

    if (importRecord) {
      await prisma.readAiIntegration.update({
        where: { id: importRecord.integrationId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'error',
          lastSyncError: error.message,
        },
      })
    }
  }
}
