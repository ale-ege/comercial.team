import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-server'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const list = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, email: true, name: true, active: true, createdAt: true },
    })
    return NextResponse.json({ users: list })
  } catch (e: any) {
    console.error('Users list error:', e)
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser(request)
  if (!sessionUser) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const email = (body.email ?? '').toString().trim().toLowerCase()
    const password = (body.password ?? '').toString()
    const name = (body.name ?? '').toString().trim()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'E-mail, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este e-mail' },
        { status: 400 }
      )
    }

    const passwordHash = hashPassword(password)
    const created = await prisma.user.create({
      data: { email, passwordHash, name, active: true },
      select: { id: true, email: true, name: true, active: true, createdAt: true },
    })
    return NextResponse.json({ user: created })
  } catch (e: any) {
    console.error('User create error:', e)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
