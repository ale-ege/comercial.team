import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-server'
import { hashPassword } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionUser = await getSessionUser(request)
  if (!sessionUser) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const id = params.id
  if (!id) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const name = body.name != null ? body.name.toString().trim() : undefined
    const active = body.active != null ? Boolean(body.active) : undefined
    const password = body.password != null ? body.password.toString() : undefined

    const data: { name?: string; active?: boolean; passwordHash?: string } = {}
    if (name !== undefined) data.name = name
    if (active !== undefined) data.active = active
    if (password !== undefined) {
      if (password.length > 0 && password.length < 6) {
        return NextResponse.json(
          { error: 'Senha deve ter no mínimo 6 caracteres' },
          { status: 400 }
        )
      }
      if (password.length > 0) data.passwordHash = hashPassword(password)
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, active: true, createdAt: true },
    })
    return NextResponse.json({ user })
  } catch (e: any) {
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    console.error('User update error:', e)
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionUser = await getSessionUser(request)
  if (!sessionUser) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const id = params.id
  if (!id) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    console.error('User delete error:', e)
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 })
  }
}
