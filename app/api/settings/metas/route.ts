import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const META_KEYS = {
  metaReunioesSemanaGeral: '21',
  metaReunioesSemanaPorCloser: '5',
  metaNotaCloser: '70',
  metaVendas: '0',
  metaLeadPorSemana: '60',
  metaGeracaoOportunidade: '75',
  metaEnvioProposta: '50',
  metaConversao: '15',
} as const

type MetaKey = keyof typeof META_KEYS

async function getMetas(): Promise<Record<MetaKey, number>> {
  try {
    const rows = await prisma.appSetting.findMany({
      where: { key: { in: Object.keys(META_KEYS) } },
    })
    const map = new Map(rows.map((r) => [r.key, r.value]))
    return {
      metaReunioesSemanaGeral: Number(map.get('metaReunioesSemanaGeral') ?? META_KEYS.metaReunioesSemanaGeral),
      metaReunioesSemanaPorCloser: Number(map.get('metaReunioesSemanaPorCloser') ?? META_KEYS.metaReunioesSemanaPorCloser),
      metaNotaCloser: Number(map.get('metaNotaCloser') ?? META_KEYS.metaNotaCloser),
      metaVendas: Number(map.get('metaVendas') ?? META_KEYS.metaVendas),
      metaLeadPorSemana: Number(map.get('metaLeadPorSemana') ?? META_KEYS.metaLeadPorSemana),
      metaGeracaoOportunidade: Number(map.get('metaGeracaoOportunidade') ?? META_KEYS.metaGeracaoOportunidade),
      metaEnvioProposta: Number(map.get('metaEnvioProposta') ?? META_KEYS.metaEnvioProposta),
      metaConversao: Number(map.get('metaConversao') ?? META_KEYS.metaConversao),
    }
  } catch {
    return {
      metaReunioesSemanaGeral: Number(META_KEYS.metaReunioesSemanaGeral),
      metaReunioesSemanaPorCloser: Number(META_KEYS.metaReunioesSemanaPorCloser),
      metaNotaCloser: Number(META_KEYS.metaNotaCloser),
      metaVendas: Number(META_KEYS.metaVendas),
      metaLeadPorSemana: Number(META_KEYS.metaLeadPorSemana),
      metaGeracaoOportunidade: Number(META_KEYS.metaGeracaoOportunidade),
      metaEnvioProposta: Number(META_KEYS.metaEnvioProposta),
      metaConversao: Number(META_KEYS.metaConversao),
    }
  }
}

export async function GET() {
  try {
    const metas = await getMetas()
    return NextResponse.json({ metas })
  } catch (error: any) {
    console.error('Erro ao buscar metas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar metas', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const keys: MetaKey[] = [
      'metaReunioesSemanaGeral',
      'metaReunioesSemanaPorCloser',
      'metaNotaCloser',
      'metaVendas',
      'metaLeadPorSemana',
      'metaGeracaoOportunidade',
      'metaEnvioProposta',
      'metaConversao',
    ]
    const updates: { key: MetaKey; value: string }[] = []
    for (const key of keys) {
      const v = body[key]
      if (typeof v === 'number' || typeof v === 'string') {
        updates.push({ key, value: String(v) })
      }
    }

    for (const { key, value } of updates) {
      await prisma.appSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    }

    const metas = await getMetas()
    return NextResponse.json({ metas })
  } catch (error: any) {
    console.error('Erro ao atualizar metas:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar metas', details: error.message },
      { status: 500 }
    )
  }
}
